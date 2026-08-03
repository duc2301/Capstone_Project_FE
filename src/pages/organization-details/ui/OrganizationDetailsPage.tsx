import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizationApi } from '@/entities/organization';
import { accountApi } from '@/entities/account';
import type { Organization, OrganizationProject, UpdateOrganizationPayload } from '@/entities/organization';
import type { ProjectStatus } from '@/entities/project';
import type { Account } from '@/entities/account';

import { statusMeta as accountStatusMeta } from '@/features/accounts';
import { useOrganizationTypes, useOrganizations, UpdateOrganizationForm } from '@/features/organizations';
import { statusMeta as projectStatusMeta } from '@/features/projects';
import { getApiErrorMessage } from '@/shared/api';
import { ConfirmDialog, Modal, PaginationBar, Toast, useToast } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

type Tab = 'general' | 'members' | 'projects';

export function OrganizationDetailsPage() {
  const { orgId: id } = useParams<{ orgId: string }>();
  const { orgTypes } = useOrganizationTypes();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [participatingProjects, setParticipatingProjects] = useState<OrganizationProject[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState(false);
  const { toast, showToast } = useToast();

  const { updateOrganization, organizations } = useOrganizations();

  const fetchMembersAndAvailable = useCallback(async () => {
    const accRes = await accountApi.getAll();
    if (accRes.data.isSuccess && accRes.data.result) {
      const allAccs = accRes.data.result;
      setMembers(allAccs.filter((acc: Account) => acc.organizationId === id));
      setAvailableAccounts(allAccs.filter((acc: Account) => !acc.organizationId || acc.organizationId !== id));
    }
  }, [id]);

  const fetchParticipatingProjects = useCallback(async () => {
    if (!id) return;
    const projRes = await organizationApi.getProjects(id);
    if (projRes.data.isSuccess && projRes.data.result) {
      setParticipatingProjects(projRes.data.result);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    void (async () => {
      try {
        const orgRes = await organizationApi.getById(id);
        if (!cancelled && orgRes.data.isSuccess && orgRes.data.result) {
          setOrganization(orgRes.data.result);
        }
        await Promise.all([fetchMembersAndAvailable(), fetchParticipatingProjects()]);
      } catch {
        if (!cancelled) setOrganization(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, fetchMembersAndAvailable, fetchParticipatingProjects]);

  const handleUpdateOrganization = async (orgId: string, payload: UpdateOrganizationPayload, selectedAccountIds?: string[], initialAccountIds?: string[]) => {
    try {
      await updateOrganization(orgId, payload);
      
      if (selectedAccountIds && initialAccountIds) {
        const added = selectedAccountIds.filter(aid => !initialAccountIds.includes(aid));
        const removed = initialAccountIds.filter(aid => !selectedAccountIds.includes(aid));
        
        const promises = [];
        for (const accountId of added) {
          promises.push(accountApi.update(accountId, { organizationId: orgId }));
        }
        for (const accountId of removed) {
          promises.push(accountApi.update(accountId, { clearOrganization: true }));
        }
        
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      }
      
      // Re-fetch organization and members
      const orgRes = await organizationApi.getById(id!);
      if (orgRes.data.isSuccess && orgRes.data.result) {
        setOrganization(orgRes.data.result);
      }
      await fetchMembersAndAvailable();
      setIsEditModalOpen(false);
    } catch (err) {
      showToast(getApiErrorMessage(err, t('orgDetail.updateError')), 'error');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-medium text-text-muted">{t('orgDetail.loading')}</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <p className="text-sm font-medium text-text-muted">{t('orgDetail.notFound')}</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return 'A';
    const words = name.trim().split(/\s+/);
    return (words.length > 1 
      ? words[0][0] + words[1][0] 
      : words[0].substring(0, 2)).toUpperCase();
  };

  const handleAddMembers = async () => {
    if (!id || selectedAccountIds.length === 0) return;
    setAddingMember(true);
    try {
      await Promise.all(
        selectedAccountIds.map((accId) => accountApi.update(accId, { organizationId: id }))
      );
      await fetchMembersAndAvailable();
      setIsAddMemberModalOpen(false);
      setSelectedAccountIds([]);
    } catch (err) {
      showToast(getApiErrorMessage(err, t('orgDetail.members.addError')), 'error');
    } finally {
      setAddingMember(false);
    }
  };

  const confirmRemoveMember = async () => {
    if (!removeMemberId) return;
    setRemovingMember(true);
    try {
      await accountApi.update(removeMemberId, { clearOrganization: true });
      await fetchMembersAndAvailable();
      setRemoveMemberId(null);
    } catch (err) {
      showToast(getApiErrorMessage(err, t('orgDetail.members.removeError')), 'error');
    } finally {
      setRemovingMember(false);
    }
  };

  const orgTypeName = orgTypes.find((ot) => ot.id === organization.organizationTypeId)?.name ?? t('org.typeOther');
  const orgProjects = participatingProjects;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {/* ── Page Header / Top Section ────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-card-border pb-4">
        <div className="flex items-center gap-5">
          <div className="flex h-[80px] w-[80px] shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-card-border bg-card shadow-sm p-1">
            <div className="h-full w-full bg-input-bg rounded-lg flex items-center justify-center text-2xl font-bold text-primary">
              {getInitials(organization.displayName || organization.legalName)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-primary">
                {organization.legalName}
              </h1>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm text-text-muted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {organization.address || t('orgDetail.noAddress')}
            </div>
          </div>
        </div>
        <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 btn-modal-ghost">
          {t('orgDetail.editProfile')}
        </button>
      </div>

      {/* ── Tabs ────────────────────────────── */}
      <div className="flex items-center gap-8 border-b border-card-border">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'general' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
        >
          {t('orgDetail.tab.general')}
          {activeTab === 'general' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'members' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
        >
          {t('orgDetail.tab.members')} ({members.length})
          {activeTab === 'members' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'projects' ? 'text-primary' : 'text-text-muted hover:text-text'}`}
        >
          {t('orgDetail.tab.projects')} ({orgProjects.length})
          {activeTab === 'projects' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
        </button>
      </div>

      {/* ── Tab Content ────────────────────────────── */}
      <div className="pt-2">
        {activeTab === 'general' && <GeneralTab organization={organization} orgTypeName={orgTypeName} />}
        {activeTab === 'members' && <MembersTab members={members} onOpenAddMember={() => setIsAddMemberModalOpen(true)} onRemoveMember={setRemoveMemberId} />}
        {activeTab === 'projects' && <ProjectsTab projects={orgProjects} organization={organization} members={members} />}
      </div>

      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[var(--radius-card-lg)] bg-card p-6 shadow-modal">
            <h2 className="heading-entity mb-4">{t('orgDetail.invite.title')}</h2>
            <div className="mb-6 max-h-60 overflow-y-auto rounded-[var(--radius-card)] border border-card-border p-2">
              {availableAccounts.length === 0 ? (
                <p className="p-4 text-center text-sm text-text-muted">{t('orgDetail.invite.empty')}</p>
              ) : (
                availableAccounts.map(acc => (
                  <label key={acc.id} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-input-bg rounded-lg transition">
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.includes(acc.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedAccountIds([...selectedAccountIds, acc.id]);
                        else setSelectedAccountIds(selectedAccountIds.filter(id => id !== acc.id));
                      }}
                      className="h-4 w-4 rounded border-card-border text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">{acc.userName}</p>
                      <p className="text-xs text-text-muted">{acc.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="btn-modal-ghost"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddMembers}
                disabled={addingMember || selectedAccountIds.length === 0}
                className="flex items-center gap-2 btn-modal-primary disabled:opacity-50"
              >
                {addingMember ? t('orgDetail.invite.saving') : t('orgDetail.invite.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <Modal title={t('orgDetail.editProfile')} onClose={() => setIsEditModalOpen(false)}>
          <div className="p-2">
            <UpdateOrganizationForm
              organization={organization}
              organizations={organizations}
              orgTypes={orgTypes}
              onSubmit={handleUpdateOrganization}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </Modal>
      )}

      <Toast toast={toast} className="z-[80]" />

      {removeMemberId && (
        <ConfirmDialog
          title={t('orgDetail.members.remove')}
          message={t('orgDetail.members.removeConfirm')}
          confirmLabel={t('orgDetail.members.remove')}
          busy={removingMember}
          onConfirm={confirmRemoveMember}
          onCancel={() => setRemoveMemberId(null)}
        />
      )}
    </div>
  );
}

function GeneralTab({ organization, orgTypeName }: { organization: Organization, orgTypeName: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Card 1 */}
        <div className="rounded-[var(--radius-card-lg)] border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold text-base mb-6">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            {t('orgDetail.legal.title')}
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-placeholder">{t('orgDetail.legal.taxCode')}</p>
              <p className="mt-1 text-sm text-text font-medium">{organization.taxCode || '---'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-placeholder">{t('orgDetail.legal.legalName')}</p>
              <p className="mt-1 text-sm text-text font-medium">{organization.legalName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-placeholder">{t('orgDetail.legal.type')}</p>
              <p className="mt-1 text-sm text-text font-medium">{orgTypeName}</p>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-[var(--radius-card-lg)] border border-card-border bg-card p-6 shadow-sm flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-primary font-bold text-base mb-6 w-full justify-start">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {t('orgDetail.representative.title')}
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card-border text-text-muted mb-4">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <p className="font-display text-base font-bold text-primary uppercase">{t('orgDetail.representative.empty')}</p>
          <p className="text-sm text-text-muted mt-1 mb-4">{t('orgDetail.representative.caption')}</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light/30 px-3 py-1.5 text-xs font-medium text-success">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        </div>

        {/* Card 3 */}
        <div className="rounded-[var(--radius-card-lg)] border border-card-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold text-base mb-6">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            {t('orgDetail.contact.title')}
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-placeholder">{t('orgDetail.contact.address')}</p>
              <p className="mt-1 text-sm text-text font-medium">{organization.address || '---'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-placeholder">{t('orgDetail.contact.phone')}</p>
              <p className="mt-1 text-sm text-text font-medium">{organization.phone || '---'}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-placeholder">EMAIL</p>
              <p className="mt-1 text-sm text-text font-medium">{organization.email || '---'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-8">
        <p className="text-xs font-bold uppercase tracking-wider text-text-placeholder mb-4">{t('orgDetail.contact.map')}</p>
        <div className="h-64 w-full rounded-[var(--radius-card-lg)] bg-card overflow-hidden border border-card-border shadow-sm">
           <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(organization.address ?? '')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
              allowFullScreen
           ></iframe>
        </div>
      </div>
    </div>
  );
}

function MembersTab({ members, onOpenAddMember, onRemoveMember }: { members: Account[], onOpenAddMember: () => void, onRemoveMember: (id: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    return members.filter(m => 
      (m.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text" 
              placeholder={t('orgDetail.members.search')} 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-64 rounded-[var(--radius-input)] border border-card-border bg-card pl-10 pr-4 text-sm text-text outline-none transition-colors focus:border-primary" 
            />
          </div>
        </div>
        <button onClick={onOpenAddMember} className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          {t('orgDetail.invite.title')}
        </button>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-sm pb-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-input-bg">
                <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-text-placeholder">{t('orgDetail.members.colMember')}</th>
                <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-text-placeholder">{t('orgDetail.members.colProjects')}</th>
                <th className="px-6 py-5 text-left text-xs font-bold uppercase tracking-wider text-text-placeholder">{t('orgDetail.members.colActivity')}</th>
                <th className="px-6 py-5 text-center text-xs font-bold uppercase tracking-wider text-text-placeholder">{t('common.col.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                    {searchQuery ? t('orgDetail.members.noResults') : t('orgDetail.members.empty')}
                  </td>
                </tr>
              ) : (
                paginatedList.map((m) => (
                  <tr key={m.id} className="hover:bg-input-bg/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card-border text-sm font-bold text-primary overflow-hidden">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt={m.userName} className="h-full w-full object-cover" />
                          ) : (
                            m.userName.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-text text-sm">{m.userName}</p>
                          <p className="text-xs text-text-placeholder mt-0.5">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-text">{m.managedProjects?.length || 0}</span> <span className="text-text-placeholder">{t('orgDetail.members.projectsUnit')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${accountStatusMeta(m.status).dotClass}`}></span>
                        <span className={`text-sm font-medium ${accountStatusMeta(m.status).textClass}`}>
                          {accountStatusMeta(m.status).label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString('vi-VN') : t('orgDetail.members.recently')}
                    </td>
                    <td className="px-6 py-4 text-center text-text-placeholder">
                      <button onClick={() => onRemoveMember(m.id)} className="hover:text-danger p-1" title={t('orgDetail.members.remove')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <PaginationBar
          page={currentPage}
          pageCount={totalPages}
          pageSize={itemsPerPage}
          total={filtered.length}
          unit={t('orgDetail.members.paginationUnit')}
          variant="inline"
          onChange={setCurrentPage}
        />
        </div>
      </div>
    </div>
  );
}

function ProjectsTab({ projects, organization, members }: { projects: OrganizationProject[], organization: Organization | null, members: Account[] }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filtered = useMemo(() => {
    return projects.filter(p => 
      (p.projectName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.projectCode || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  return (
    <div className="space-y-6">
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text"
            placeholder={t('orgDetail.projects.search')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-[var(--radius-input)] border border-card-border bg-card py-2.5 pl-10 pr-4 text-sm text-text shadow-card outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
           <div className="col-span-full py-8 text-center text-text-muted">
             {searchQuery ? t('orgDetail.projects.noResults') : t('orgDetail.projects.empty')}
           </div>
        ) : (
          paginatedList.map((p, i) => {
            let roleText = t('orgDetail.projects.rolePartner');
            if (organization && p.ownerOrganizationId === organization.id) {
              roleText = t('orgDetail.projects.roleOwner');
            } else if (members.some(m => m.id === p.managerAccountId)) {
              roleText = t('orgDetail.projects.roleManager');
            }

            return (
              <div key={i} className="group flex flex-col overflow-hidden rounded-[20px] border border-card-border bg-card shadow-sm transition-all hover:shadow-md">
                {/* Image & Status Badge */}
                <div className="relative h-40 w-full bg-card-border overflow-hidden">
                  {p.projectImageUrl ? (
                    <img src={p.projectImageUrl} alt={p.projectName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-card-border to-border-sage"></div>
                  )}
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-primary/90 backdrop-blur-md px-3 py-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${projectStatusMeta(p.status as ProjectStatus).dotClass}`}></span>
                    <span className="text-2xs font-bold uppercase tracking-wider text-white">
                      {projectStatusMeta(p.status as ProjectStatus).label}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h4 className="font-bold text-text text-base leading-tight line-clamp-2 font-serif">{p.projectName}</h4>
                    {p.projectCode && (
                      <span className="shrink-0 rounded-full bg-content-bg px-3 py-1 text-xs font-medium text-primary">
                        {p.projectCode}
                      </span>
                    )}
                  </div>

                  <div className="mb-6 space-y-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-text-placeholder">{t('orgDetail.projects.roleLabel')}</span>
                      <span className="font-medium text-text">{roleText}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="mt-auto w-full rounded-[14px] border border-card-border bg-transparent py-2.5 text-sm font-medium text-text transition hover:bg-content-bg"
                  >
                    {t('orgDetail.projects.view')}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <PaginationBar
          page={currentPage}
          pageCount={totalPages}
          pageSize={itemsPerPage}
          total={filtered.length}
          unit={t('orgDetail.projects.paginationUnit')}
          variant="inline"
          onChange={setCurrentPage}
        />
    </div>
  );
}
