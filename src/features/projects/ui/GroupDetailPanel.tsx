import { useMemo, useState } from 'react';

import type { Account } from '@/entities/account';
import type { CreateGroupPayload, Group, GroupMember } from '@/entities/group';
import { GroupMemberStatus } from '@/entities/group';
import { GroupMemberRole } from '@/entities/invitation';
import type { Organization } from '@/entities/organization';
import { ActionIconButton, ConfirmDialog, Modal, PaginationBar, RowActions, ToolbarIconButton, UserAvatar } from '@/shared/components';
import { formatDate } from '@/shared/lib/format';
import { t } from '@/shared/lib/i18n';
import type { InviteManyInput, InviteManyResult } from '../model/useProjectInvite';
import { EditGroupModal } from './EditGroupModal';
import { GroupPartnerModal } from './GroupPartnerModal';
import { InviteMemberForm } from './InviteMemberForm';

const PAGE_SIZE = 10;

type RoleFilter = 'all' | 'leader' | 'member';

const ROLE_FILTERS: { id: RoleFilter; key: 'projectDetail.teams.filter.all' | 'projectDetail.teams.role.leader' | 'projectDetail.teams.role.member' }[] = [
  { id: 'all', key: 'projectDetail.teams.filter.all' },
  { id: 'leader', key: 'projectDetail.teams.role.leader' },
  { id: 'member', key: 'projectDetail.teams.role.member' },
];

interface Props {
  projectId: string;
  group: Group;
  organizations: Organization[];
  accounts: Account[];
  canManage: boolean;
  canChangeRole: boolean;
  onBack: () => void;
  onUpdateGroup: (groupId: string, payload: Partial<CreateGroupPayload>) => Promise<void>;
  onChangeRole: (groupId: string, accountId: string, newRole: number) => Promise<void>;
  onRemoveMember: (groupId: string, accountId: string) => Promise<void>;
  onInvite: (input: InviteManyInput) => Promise<InviteManyResult>;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export function GroupDetailPanel({
  projectId,
  group,
  organizations,
  accounts,
  canManage,
  canChangeRole,
  onBack,
  onUpdateGroup,
  onChangeRole,
  onRemoveMember,
  onInvite,
  onShowToast,
}: Props) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<GroupMember | null>(null);
  const [busyAccountId, setBusyAccountId] = useState<string | null>(null);

  const partner = organizations.find((o) => o.id === group.organizationId);
  const partnerName = partner ? partner.displayName || partner.legalName : null;

  const activeMembers = useMemo(
    () => group.members.filter((m) => m.status !== GroupMemberStatus.Left),
    [group.members],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return activeMembers.filter((m) => {
      if (roleFilter === 'leader' && m.role !== GroupMemberRole.Leader) return false;
      if (roleFilter === 'member' && m.role === GroupMemberRole.Leader) return false;
      if (!term) return true;
      return m.userName.toLowerCase().includes(term)
        || (m.email ?? '').toLowerCase().includes(term);
    });
  }, [activeMembers, query, roleFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  const runMemberAction = async (accountId: string, action: () => Promise<void>) => {
    setBusyAccountId(accountId);
    try {
      await action();
    } finally {
      setBusyAccountId(null);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <ToolbarIconButton
        size="sm"
        variant="ghost"
        label={t('projectDetail.teams.detail.back')}
        onClick={onBack}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        }
      />

      <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <div className="min-w-0">
            <h3 className="heading-tab break-words">{group.name}</h3>
            {group.description && (
              <p className="mt-0.5 text-sm text-text-muted">{group.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                <strong className="font-semibold text-text">{activeMembers.length}</strong>
                {t('projectDetail.teams.membersSuffix')}
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <path d="M9 22v-4h6v4" />
                </svg>
                {t('projectDetail.partners.managedBy')}
                <strong className="font-semibold text-text">
                  {partnerName ?? t('projectDetail.teams.editGroup.noPartner')}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setPartnerOpen(true)}
              className="flex items-center gap-2 rounded-[var(--radius-button)] border border-card-border bg-card px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <path d="M9 22v-4h6v4" />
              </svg>
              {t('projectDetail.teams.detail.partner')}
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 rounded-[var(--radius-button)] border border-card-border bg-card px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:border-primary hover:text-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {t('projectDetail.teams.detail.edit')}
            </button>
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              {t('projectDetail.teams.detail.invite')}
            </button>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-[420px]">
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); resetPage(); }}
            placeholder={t('projectDetail.teams.detail.search')}
            className="w-full rounded-[var(--radius-input)] border border-card-border bg-card py-2.5 pl-11 pr-10 text-sm text-text shadow-card outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); resetPage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as RoleFilter); resetPage(); }}
          aria-label={t('projectDetail.teams.detail.roleFilter')}
          className="field-select w-auto shrink-0 border-card-border bg-card shadow-card"
        >
          {ROLE_FILTERS.map((f) => (
            <option key={f.id} value={f.id}>{t(f.key)}</option>
          ))}
        </select>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
        <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="table-head bg-content-bg">
                <th className="px-6 py-3.5">{t('projectDetail.teams.detail.col.member')}</th>
                <th className="px-5 py-3.5">{t('projectDetail.teams.detail.col.role')}</th>
                <th className="px-5 py-3.5">{t('projectDetail.teams.detail.col.joinedAt')}</th>
                <th className="px-6 py-3.5 text-right">{t('common.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-sm text-text-muted">
                      {query || roleFilter !== 'all'
                        ? t('projectDetail.teams.detail.noResults')
                        : t('projectDetail.teams.noMembers')}
                    </p>
                  </td>
                </tr>
              ) : (
                pageItems.map((member) => {
                  const isLeader = member.role === GroupMemberRole.Leader;
                  const busy = busyAccountId === member.accountId;
                  return (
                    <tr key={member.accountId} className="border-t border-card-border/60 transition-colors duration-150 hover:bg-primary-ghost">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar userName={member.userName} className="ring-[3px] ring-primary/10" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-text">{member.userName}</p>
                            {member.email && <p className="truncate text-xs text-text-muted">{member.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-[var(--radius-badge)] px-2.5 py-0.5 text-xs font-bold tracking-[0.4px] ${
                          isLeader ? 'bg-primary-tint text-primary-deep' : 'bg-content-bg text-text-secondary'
                        }`}>
                          {isLeader ? t('projectDetail.teams.role.leader') : t('projectDetail.teams.role.member')}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-text-secondary">
                        {member.joinedAt ? formatDate(member.joinedAt) : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <RowActions>
                          {canChangeRole && (
                            <ActionIconButton
                              tone="primary"
                              disabled={busy}
                              label={isLeader
                                ? t('projectDetail.teams.member.demote')
                                : t('projectDetail.teams.member.promote')}
                              icon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  {isLeader
                                    ? <><polyline points="19 12 12 19 5 12" /><line x1="12" y1="5" x2="12" y2="19" /></>
                                    : <><polyline points="5 12 12 5 19 12" /><line x1="12" y1="19" x2="12" y2="5" /></>}
                                </svg>
                              }
                              onClick={() => void runMemberAction(member.accountId, () =>
                                onChangeRole(
                                  group.id,
                                  member.accountId,
                                  isLeader ? GroupMemberRole.Member : GroupMemberRole.Leader,
                                ))}
                            />
                          )}
                          {canManage && (
                            <ActionIconButton
                              tone="danger"
                              disabled={busy}
                              label={t('projectDetail.teams.member.remove')}
                              icon={
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                  <circle cx="8.5" cy="7" r="4" />
                                  <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                              }
                              onClick={() => setRemoveTarget(member)}
                            />
                          )}
                        </RowActions>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={currentPage}
          pageCount={pageCount}
          pageSize={PAGE_SIZE}
          total={filtered.length}
          unit={t('account.pagination.members')}
          variant="inline"
          onChange={setPage}
        />
      </div>

      {editOpen && (
        <EditGroupModal
          group={group}
          onClose={() => setEditOpen(false)}
          onSubmit={onUpdateGroup}
          onError={(msg) => onShowToast(msg, 'error')}
        />
      )}

      {partnerOpen && (
        <GroupPartnerModal
          group={group}
          organizations={organizations}
          onClose={() => setPartnerOpen(false)}
          onSubmit={onUpdateGroup}
          onError={(msg) => onShowToast(msg, 'error')}
        />
      )}

      {inviteOpen && (
        <Modal
          title={t('projectDetail.teams.detail.invite')}
          maxWidth="max-w-3xl"
          onClose={() => setInviteOpen(false)}
        >
          <InviteMemberForm
            projectId={projectId}
            accounts={accounts}
            groups={[group]}
            loadingGroups={false}
            lockedGroupId={group.id}
            onSubmit={onInvite}
          />
        </Modal>
      )}

      {removeTarget && (
        <ConfirmDialog
          title={t('projectDetail.teams.member.remove')}
          message={t('projectDetail.teams.detail.removeConfirm').replace('{name}', removeTarget.userName)}
          confirmLabel={t('projectDetail.teams.member.remove')}
          tone="danger"
          busy={busyAccountId === removeTarget.accountId}
          onConfirm={() => void runMemberAction(removeTarget.accountId, async () => {
            await onRemoveMember(group.id, removeTarget.accountId);
            setRemoveTarget(null);
          })}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}
