import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { accountApi } from '@/entities/account/api/accountApi';
import type { Organization } from '@/entities/organization';
import {
  CreateOrganizationForm,
  UpdateOrganizationForm,
  useOrganizations,
  useOrganizationTypes,
} from '@/features/organizations';
import { t } from '@/shared/lib/i18n';

type FormMode = 'idle' | 'create' | 'create-jv' | 'edit';



/* ── Modal wrapper ─────────────────────────────────── */
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] animate-scale-in overflow-y-auto rounded-[var(--radius-card-lg)] bg-card shadow-modal">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-card-border bg-card px-7 py-5">
          <h2 className="font-heading text-lg font-bold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────── */
export function OrganizationsPage() {
  const navigate = useNavigate();
  const { organizations, loading, error, createOrganization, updateOrganization, deleteOrganization } = useOrganizations();
  const { orgTypes, createOrgType } = useOrganizationTypes();

  const [formMode, setFormMode] = useState<FormMode>('idle');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /* ── Handlers ────────────────────────────────────── */
  const handleCreate = async (payload: Parameters<typeof createOrganization>[0], selectedAccountIds?: string[]) => {
    const newOrg = await createOrganization(payload);
    if (newOrg && selectedAccountIds && selectedAccountIds.length > 0) {
      await Promise.all(selectedAccountIds.map(accId => 
        accountApi.update(accId, { organizationId: newOrg.id })
      ));
    }
    setFormMode('idle');
  };

  const handleUpdate = async (id: string, payload: Parameters<typeof updateOrganization>[1], selectedAccountIds?: string[], initialAccountIds?: string[]) => {
    try {
      await updateOrganization(id, payload);
      
      if (selectedAccountIds && initialAccountIds) {
        const added = selectedAccountIds.filter(aid => !initialAccountIds.includes(aid));
        const removed = initialAccountIds.filter(aid => !selectedAccountIds.includes(aid));
        
        const promises = [];
        for (const accountId of added) {
          promises.push(accountApi.update(accountId, { organizationId: id }));
        }
        for (const accountId of removed) {
          promises.push(accountApi.update(accountId, { clearOrganization: true }));
        }
        
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      }
      
      setFormMode('idle');
      setSelectedOrg(null);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('org.deleteConfirm'))) return;
    await deleteOrganization(id);
  };

  const openEdit = (org: Organization) => {
    setSelectedOrg(org);
    setFormMode('edit');
  };

  const closeForm = () => {
    setFormMode('idle');
    setSelectedOrg(null);
  };

  /* ── Status / Type Color Helpers ─────────────────── */
  const filtered = useMemo(() => {
    return organizations.filter(o => 
      (o.displayName || o.legalName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [organizations, searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const stats = useMemo(() => {
    return {
      total: organizations.length,
      active: organizations.length,
      recent: 5,
    };
  }, [organizations]);

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Đang hoạt động': return 'bg-success';
      case 'Chờ duyệt': return 'bg-text-placeholder';
      case 'Tạm ngưng': return 'bg-danger';
      default: return 'bg-text-placeholder';
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type.toUpperCase()) {
      case 'XÂY DỰNG': return 'bg-[#F4ECE1] text-[#9A7352]';
      case 'CƠ ĐIỆN': return 'bg-[#EFEFEF] text-[#666666]';
      case 'KIẾN TRÚC': return 'bg-[#EAF3EB] text-[#4F8A52]';
      default: return 'bg-info-light text-info';
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[28px] font-bold text-[#40562D]">
            {t('org.title')}
          </h1>
          <p className="mt-1 text-[15px] text-[#73796B]">
            Quản lý các pháp nhân và đơn vị tham gia hệ thống
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => setFormMode('create-jv')}
            className="flex items-center gap-2 rounded-full bg-[#647C54] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#4E6342]"
          >
            + Thêm Liên doanh
          </button>
          <button
            onClick={() => setFormMode('create')}
            className="flex items-center gap-2 rounded-full bg-[#647C54] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#4E6342]"
          >
            + Thêm Doanh nghiệp
          </button>
        </div>
      </div>

      {/* ── Statistics Cards ───────────────────────── */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C] mb-3">Tổng số doanh nghiệp</p>
            <p className="text-2xl font-serif text-[#647C54]">{stats.total} <span className="text-[15px] font-sans text-[#73796B]">người</span></p>
          </div>
          {/* Card 2 */}
          <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C] mb-3">Tổng số liên doanh</p>
            <p className="text-2xl font-serif text-[#647C54]">{organizations.filter(o => o.isJointVenture).length} <span className="text-[15px] font-sans text-[#73796B]">người</span></p>
          </div>
          {/* Card 3 */}
          <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C] mb-3">Đang hoạt động</p>
            <p className="text-2xl font-serif text-[#647C54]">{stats.active}</p>
          </div>
          {/* Card 4 */}
          <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#A3A89C] mb-3">Thêm gần đây</p>
            <p className="text-2xl font-serif text-[#647C54]">+{stats.recent}</p>
          </div>
        </div>
      )}

      {/* ── Filter Bar ─────────────────────────────── */}
      {!loading && !error && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between rounded-[24px] border border-card-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <select className="appearance-none rounded-full border border-card-border bg-transparent px-4 py-2 pr-10 text-[13px] font-medium text-text outline-none focus:border-[#647C54]">
                <option>Lĩnh vực: Tất cả</option>
                <option>Xây dựng</option>
                <option>Cơ điện</option>
                <option>Kiến trúc</option>
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            
            <div className="relative">
              <select className="appearance-none rounded-full border border-card-border bg-transparent px-4 py-2 pr-10 text-[13px] font-medium text-text outline-none focus:border-[#647C54]">
                <option>Trạng thái: Hoạt động</option>
                <option>Chờ duyệt</option>
                <option>Tạm ngưng</option>
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none rounded-full border border-card-border bg-transparent px-4 py-2 text-[13px] font-medium text-text outline-none focus:border-[#647C54]"
              />
            </div>
            
            <button className="flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-text transition hover:bg-input-bg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
              Bộ lọc nâng cao
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-card-border text-text transition hover:bg-input-bg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-card-border text-text transition hover:bg-input-bg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Loading ────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center rounded-[24px] border border-card-border bg-card py-20 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <svg className="h-8 w-8 animate-spin text-[#647C54]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-[13px] text-text-muted">{t('common.loading')}</p>
          </div>
        </div>
      )}

      {/* ── Error ──────────────────────────────────── */}
      {error && (
        <div className="rounded-[24px] border border-danger/20 bg-danger-light p-6 text-center">
          <p className="text-[13px] font-medium text-danger">{error}</p>
        </div>
      )}

      {/* ── Data Table ─────────────────────────────── */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-[24px] border border-card-border bg-card shadow-sm pb-2">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">
                    Tên doanh nghiệp & ID
                  </th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">
                    Lĩnh vực
                  </th>
                  <th className="px-6 py-5 text-center text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">
                    Dự án
                  </th>
                  <th className="px-6 py-5 text-left text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">
                    Trạng thái
                  </th>
                  <th className="px-6 py-5 text-center text-[11px] font-bold uppercase tracking-wider text-[#A3A89C]">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-[13px] text-text-muted">
                          {searchQuery ? t('org.noResults') : t('common.noData')}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((org) => {
                    const orgTypeName = orgTypes.find(t => t.id === org.organizationTypeId)?.name || 'Khác';
                    const statusText = org.taxCode || org.isJointVenture ? 'Đang hoạt động' : 'Chờ duyệt';
                    const projectsCount = org.participatingProjectsCount || 0;
                    const rawName = (org.displayName || org.legalName || 'A').trim();
                    const words = rawName.split(/\s+/);
                    const initials = (words.length > 1 
                      ? words[0][0] + words[1][0] 
                      : words[0].substring(0, 2)).toUpperCase();
                    
                    return (
                      <tr 
                        key={org.id} 
                        onClick={() => navigate(`/organizations/${org.id}`)}
                        className="transition-colors duration-150 hover:bg-input-bg/50 group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-card-border bg-[#F8F7F2] text-[14px] font-bold text-[#647C54]">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-[#2D3A28] text-[14px]">{org.displayName || org.legalName}</p>
                              <p className="text-[12px] text-[#A3A89C] mt-0.5">ID: ORG-{org.id.substring(0, 6).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold tracking-wide ${getTypeBadgeStyle(orgTypeName)}`}>
                            {orgTypeName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-[#2D3A28] text-[14px] bg-[#F8F7F2] px-3 py-1 rounded-full">{projectsCount.toString().padStart(2, '0')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${getStatusDot(statusText)}`}></span>
                            <span className="text-[13px] font-medium text-[#43493C]">{statusText}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3 text-[#A3A89C]">
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/organizations/${org.id}`); }} 
                              className="transition hover:text-[#647C54]"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); openEdit(org); }} 
                              className="transition hover:text-[#647C54]"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(org.id); }} 
                              className="transition hover:text-danger"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            
            {filtered.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-card-border mt-2">
                <span className="text-[13px] text-text-muted">
                  Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} của {filtered.length} Doanh nghiệp
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-input-bg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const page = idx + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button 
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`flex h-7 w-7 items-center justify-center rounded-md font-medium text-[13px] transition ${currentPage === page ? 'bg-[#647C54] text-white shadow-sm' : 'text-[#43493C] hover:bg-input-bg'}`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="flex h-7 w-7 items-center justify-center text-text-muted text-[13px]">...</span>;
                    }
                    return null;
                  })}

                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-input-bg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Create Modal ───────────────────────────── */}
      {formMode === 'create' && (
        <Modal title={t('org.modal.createTitle')} onClose={closeForm}>
          <CreateOrganizationForm mode="organization" orgTypes={orgTypes} organizations={organizations} onSubmit={handleCreate} onCancel={closeForm} onCreateOrgType={createOrgType} />
        </Modal>
      )}
      
      {/* ── Create Joint Venture Modal ───────────────────────────── */}
      {formMode === 'create-jv' && (
        <Modal title="Thêm liên danh mới" onClose={closeForm}>
          <CreateOrganizationForm mode="joint-venture" orgTypes={orgTypes} organizations={organizations} onSubmit={handleCreate} onCancel={closeForm} onCreateOrgType={createOrgType} />
        </Modal>
      )}

      {/* ── Edit Modal ─────────────────────────────── */}
      {formMode === 'edit' && selectedOrg && (
        <Modal title={t('org.modal.editTitle')} onClose={closeForm}>
          <UpdateOrganizationForm
            organization={selectedOrg}
            organizations={organizations}
            orgTypes={orgTypes}
            onSubmit={handleUpdate}
            onCancel={closeForm}
            onCreateOrgType={createOrgType}
          />
        </Modal>
      )}
    </div>
  );
}

