import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import type { CreateGroupPayload, Group, GroupMember } from '@/entities/group';
import { groupApi, GroupMemberStatus } from '@/entities/group';
import { GroupMemberRole } from '@/entities/invitation';
import type { Organization } from '@/entities/organization';
import { isAccountAdmin, useSession } from '@/entities/session';
import { DocumentsTab } from '@/features/folders';
import { useOrganizations } from '@/features/organizations';
import type { AddGroupInput } from '@/features/projects';
import {
  CreateGroupForm,
  ManageProjectPanel,
  useProjectDetail,
  useProjectGroups,
  useProjectInvite,
} from '@/features/projects';
import { getApiErrorMessage } from '@/shared/api';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

/* ── Lookup tables (numeric enum → i18n key) ───────────── */
const STATUS_KEYS: Record<number, TranslationKey> = {
  0: 'projects.status.planning',
  1: 'projects.status.active',
  2: 'projects.status.onHold',
  3: 'projects.status.completed',
  4: 'projects.status.closed',
};
const STATUS_BADGE: Record<number, string> = {
  0: 'bg-info-light text-info',
  1: 'bg-success-light text-success',
  2: 'bg-warning-light text-warning',
  3: 'bg-primary-light text-primary',
  4: 'bg-danger-light text-danger',
};
const PHASE_STEPS: { key: TranslationKey }[] = [
  { key: 'projects.phase.concept' },
  { key: 'projects.phase.design' },
  { key: 'projects.phase.construction' },
  { key: 'projects.phase.handover' },
  { key: 'projects.phase.operation' },
];

type TabId = 'info' | 'partners' | 'packages' | 'teams' | 'documents' | 'settings';
const TABS: { id: TabId; key: TranslationKey }[] = [
  { id: 'info', key: 'projectDetail.tab.info' },
  { id: 'partners', key: 'projectDetail.tab.partners' },
  { id: 'packages', key: 'projectDetail.tab.packages' },
  { id: 'teams', key: 'projectDetail.tab.teams' },
  { id: 'documents', key: 'projectDetail.tab.documents' },
  { id: 'settings', key: 'projectDetail.tab.settings' },
];

const cardClass =
  'rounded-[24px] border border-card-border/60 bg-card/70 p-8 shadow-card backdrop-blur-sm';

/* ── Small presentational helpers ──────────────────────── */
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}
function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl animate-scale-in rounded-[var(--radius-card-lg)] bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-7 py-5">
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
        <div className="max-h-[70vh] overflow-y-auto px-7 py-6">{children}</div>
      </div>
    </div>
  );
}

function SectionHeading({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <h3 className="font-display text-base font-medium text-primary">{title}</h3>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</span>
      {children}
    </div>
  );
}

function NotUpdated() {
  return <span className="text-sm italic text-text-placeholder">{t('projectDetail.common.notUpdated')}</span>;
}

/* Thông số kỹ thuật — hàng ngang (diện tích khu đất, GFA…) */
function SpecMini({ icon, label, value }: { icon: React.ReactNode; label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#C3C9B9]/30 bg-[#F0EEE6] p-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">{label}</p>
        <p className="mt-0.5 text-base font-semibold text-text">{value ?? <NotUpdated />}</p>
      </div>
    </div>
  );
}

/* Thông số kỹ thuật — ô vuông căn giữa (số tầng, BIM level) */
function SpecBox({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-[#C3C9B9]/30 bg-[#F0EEE6] p-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="text-lg font-bold text-text">{value ?? <NotUpdated />}</p>
    </div>
  );
}

/* Dòng thời gian — mốc ngày kèm thanh màu */
function DatePoint({ barClass, label, value }: { barClass: string; label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-10 w-2 shrink-0 rounded-full ${barClass}`} />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted">{label}</p>
        <p className="text-lg font-bold text-text">{value ?? <NotUpdated />}</p>
      </div>
    </div>
  );
}

function ComingSoon() {
  return (
    <div className="rounded-[24px] border border-dashed border-card-border bg-card/70 p-16 text-center shadow-card">
      <p className="text-sm text-text-muted">{t('projectDetail.comingSoon')}</p>
    </div>
  );
}

/* ── Group member row ──────────────────────────────────── */
function MemberRow({
  member,
  groupId,
  isAdminOrManager,
  onChangeRole,
  onRemoveMember,
}: {
  member: GroupMember;
  groupId: string;
  isAdminOrManager?: boolean;
  onChangeRole: (groupId: string, accountId: string, newRole: number) => Promise<void>;
  onRemoveMember: (groupId: string, accountId: string) => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const isLeader = member.role === GroupMemberRole.Leader;

  const run = async (action: () => Promise<void>) => {
    setMenuOpen(false);
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3 group/member">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
        {member.userName.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{member.userName}</p>
        {member.email && <p className="truncate text-xs text-text-muted">{member.email}</p>}
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isLeader ? 'bg-primary text-white' : 'bg-content-bg text-text-secondary'
          }`}
      >
        {isLeader ? t('projectDetail.teams.role.leader') : t('projectDetail.teams.role.member')}
      </span>

      {/* 3-dot menu */}
      {isAdminOrManager && (
        <div className="relative">
          <button
            disabled={busy}
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-content-bg hover:text-primary opacity-0 group-hover/member:opacity-100 transition-all disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-card-border bg-card p-1 shadow-dropdown animate-fade-in">
                <button
                  onClick={() => {
                    const newRole = isLeader ? GroupMemberRole.Member : GroupMemberRole.Leader;
                    run(() => onChangeRole(groupId, member.accountId, newRole));
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-text transition-colors hover:bg-content-bg hover:text-primary"
                >
                  {isLeader ? t('projectDetail.teams.member.demote') : t('projectDetail.teams.member.promote')}
                </button>
                <button
                  onClick={() => run(() => onRemoveMember(groupId, member.accountId))}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-light"
                >
                  {t('projectDetail.teams.member.remove')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Group (team) card ─────────────────────────────────── */
function GroupCard({
  group,
  organizations,
  isAdmin,
  isAdminOrManager,
  onUpdateGroup,
  onRemoveGroup,
  onChangeRole,
  onRemoveMember,
  onShowToast,
}: {
  group: Group;
  organizations: Organization[];
  isAdmin: boolean;
  isAdminOrManager: boolean;
  onUpdateGroup: (groupId: string, payload: Partial<CreateGroupPayload>) => Promise<void>;
  onRemoveGroup: (groupId: string) => Promise<void>;
  onChangeRole: (groupId: string, accountId: string, newRole: number) => Promise<void>;
  onRemoveMember: (groupId: string, accountId: string) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [open, setOpen] = useState(false);
  const [editGroupModalOpen, setEditGroupModalOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removingGroup, setRemovingGroup] = useState(false);
  const [editingName, setEditingName] = useState(group.name);
  const [editingDesc, setEditingDesc] = useState(group.description || '');
  const [editingOrgId, setEditingOrgId] = useState(group.organizationId || '');
  const [updatingGroup, setUpdatingGroup] = useState(false);

  const partner = group.organizationId ? organizations.find((o) => o.id === group.organizationId) : null;
  const partnerName = partner ? (partner.displayName || partner.legalName) : null;

  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-[#C3C9B9] bg-card p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <div>
            <h3 className="font-display text-xl text-primary">{group.name}</h3>
            {group.description && <p className="text-sm text-text-muted mt-0.5">{group.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isAdminOrManager && (
            <button
              onClick={() => {
                setEditingName(group.name);
                setEditingDesc(group.description || '');
                setEditingOrgId(group.organizationId || '');
                setEditGroupModalOpen(true);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-content-bg hover:text-primary transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
          )}
          {isAdmin && (
            <button
              title={t('projectDetail.teams.removeGroup')}
              onClick={() => setRemoveConfirmOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-danger-light hover:text-danger transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {partnerName && (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
              <path d="M9 22v-4h6v4" />
              <path d="M8 6h.01" />
              <path d="M16 6h.01" />
              <path d="M12 6h.01" />
              <path d="M12 10h.01" />
              <path d="M12 14h.01" />
              <path d="M16 10h.01" />
              <path d="M16 14h.01" />
              <path d="M8 10h.01" />
              <path d="M8 14h.01" />
            </svg>
            <span className="truncate flex items-center gap-2">
              {t('projectDetail.partners.managedBy')} <span className="font-bold text-text">{partnerName}</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <span>
            {group.members.length} {t('projectDetail.teams.membersSuffix')}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[rgba(88,127,57,0.1)] py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
      >
        {open ? t('projectDetail.teams.hideDetail') : t('projectDetail.teams.viewDetail')}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="space-y-3 border-t border-card-border pt-4">
          {(() => {
            const activeMembers = group.members.filter((m) => m.status !== GroupMemberStatus.Left);
            return activeMembers.length === 0 ? (
              <p className="text-sm text-text-muted">{t('projectDetail.teams.noMembers')}</p>
            ) : (
              activeMembers.map((m) => (
                <MemberRow
                  key={m.accountId}
                  member={m}
                  groupId={group.id}
                  isAdminOrManager={isAdminOrManager}
                  onChangeRole={onChangeRole}
                  onRemoveMember={onRemoveMember}
                />
              ))
            );
          })()}
        </div>
      )}

      {editGroupModalOpen && (
        <Modal title={t('projectDetail.teams.editGroup.title')} onClose={() => setEditGroupModalOpen(false)}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text">{t('projectDetail.teams.editGroup.name')}</label>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="rounded-[var(--radius-input)] border border-card-border bg-content-bg p-3 text-sm text-text outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text">{t('projectDetail.teams.editGroup.description')}</label>
              <input
                type="text"
                value={editingDesc}
                onChange={(e) => setEditingDesc(e.target.value)}
                className="rounded-[var(--radius-input)] border border-card-border bg-content-bg p-3 text-sm text-text outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text">{t('projectDetail.teams.editGroup.partner')}</label>
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto admin-scrollbar pr-2">
                <button
                  onClick={() => setEditingOrgId('')}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${!editingOrgId ? 'border-primary bg-primary/5' : 'border-card-border bg-card hover:border-primary/50'
                    }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-content-bg text-text-muted">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-text">{t('projectDetail.teams.editGroup.noPartner')}</p>
                </button>
                {organizations.map((org) => {
                  const orgName = org.displayName || org.legalName || '---';
                  const isSelected = editingOrgId === org.id;
                  return (
                    <button
                      key={org.id}
                      onClick={() => setEditingOrgId(org.id)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-card-border bg-card hover:border-primary/50'
                        }`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                        }`}>
                        {orgName.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text">{orgName}</p>
                        <p className="truncate text-xs text-text-muted">{org.taxCode || '---'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>



            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={updatingGroup}
                onClick={() => setEditGroupModalOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-text-secondary hover:bg-content-bg"
              >
                {t('projectDetail.teams.editGroup.cancel')}
              </button>
              <button
                type="button"
                disabled={!editingName.trim() || updatingGroup}
                onClick={async () => {
                  try {
                    setUpdatingGroup(true);
                    await onUpdateGroup(group.id, {
                      name: editingName.trim(),
                      description: editingDesc.trim() || undefined,
                      organizationId: editingOrgId || undefined,
                    });
                    setEditGroupModalOpen(false);
                    onShowToast(t('projectDetail.teams.toast.groupUpdated'));
                  } catch (err) {
                    onShowToast(getApiErrorMessage(err, t('common.error')), 'error');
                  } finally {
                    setUpdatingGroup(false);
                  }
                }}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {updatingGroup ? t('common.loading') : t('projectDetail.teams.editGroup.save')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {removeConfirmOpen && (
        <Modal title={t('projectDetail.teams.removeGroup.title')} onClose={() => setRemoveConfirmOpen(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary">
              {t('projectDetail.teams.removeGroup.desc')}
            </p>
            <div className="flex items-center gap-3 rounded-xl border border-card-border bg-content-bg p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                {group.name.charAt(0).toUpperCase()}
              </span>
              <p className="truncate text-sm font-semibold text-text">{group.name}</p>
            </div>
            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                disabled={removingGroup}
                onClick={() => setRemoveConfirmOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-text-secondary hover:bg-content-bg"
              >
                {t('projectDetail.teams.removeGroup.cancel')}
              </button>
              <button
                type="button"
                disabled={removingGroup}
                onClick={async () => {
                  try {
                    setRemovingGroup(true);
                    await onRemoveGroup(group.id);
                    setRemoveConfirmOpen(false);
                  } finally {
                    setRemovingGroup(false);
                  }
                }}
                className="rounded-xl bg-danger px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-danger/90 disabled:opacity-50"
              >
                {removingGroup ? t('common.loading') : t('projectDetail.teams.removeGroup.submit')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { project, loading, error, assignManager } = useProjectDetail(projectId);
  const { accounts, inviteMany } = useProjectInvite();
  const { groups, loading: groupsLoading, addGroup, removeGroup, refresh: refreshGroups } = useProjectGroups(projectId);
  const { organizations } = useOrganizations();

  // Tính toán danh sách đối tác đã tham gia dự án
  const projectPartners = useMemo(() => {
    const orgIds = new Set(groups.map((g) => g.organizationId).filter(Boolean));
    return organizations.filter((org) => orgIds.has(org.id));
  }, [groups, organizations]);

  const { currentUser } = useSession();
  const [searchParams] = useSearchParams();

  // Tab khởi tạo theo ?tab= (để quay lại đúng tab Tài liệu từ trang xem chi tiết file).
  const initialTab = (TABS.find((x) => x.id === searchParams.get('tab'))?.id ?? 'info') as TabId;
  const [tab, setTab] = useState<TabId>(initialTab);
  const [manageOpen, setManageOpen] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const managerName = useMemo(() => {
    if (!project?.managerAccountId) return null;
    return accounts.find((a) => a.id === project.managerAccountId)?.userName ?? project.managerAccountId;
  }, [accounts, project]);

  const isAdmin = isAccountAdmin(currentUser?.role);
  const isManager = project?.managerAccountId === currentUser?.accountId;
  const canViewAllTabs = isAdmin || isManager;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAssign = async (payload: Parameters<typeof assignManager>[0]) => {
    try {
      await assignManager(payload);
      showToast(t('projects.toast.managerAssigned'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('common.error')), 'error');
    }
  };

  const handleInvite = async (input: Parameters<typeof inviteMany>[0]) => {
    const result = await inviteMany(input);
    if (result.sent === 0) {
      showToast(result.errorMessage ?? t('common.error'), 'error');
    } else if (result.failed > 0) {
      showToast(result.errorMessage ?? t('projects.toast.invitedPartial'), 'error');
    } else {
      showToast(t('projects.toast.invited'));
    }
    return result;
  };

  const handleAddGroup = async (input: AddGroupInput) => {
    try {
      await addGroup(input);
      setAddGroupOpen(false);
      showToast(t('projectDetail.teams.toast.groupAdded'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('common.error')), 'error');
    }
  };

  const handleUpdateGroup = async (groupId: string, payload: Partial<CreateGroupPayload>) => {
    await groupApi.update(groupId, payload);
    await refreshGroups();
  };

  // Xóa mềm 1 nhóm khỏi dự án (chỉ Admin).
  const handleRemoveGroup = async (groupId: string) => {
    try {
      await removeGroup(groupId);
      showToast(t('projectDetail.teams.toast.groupRemoved'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('common.error')), 'error');
    }
  };

  // Đổi vai trò 1 thành viên (Leader => chuyển trưởng nhóm).
  const handleChangeRole = async (groupId: string, accountId: string, newRole: number) => {
    try {
      await groupApi.changeMemberRole(groupId, accountId, { role: newRole });
      await refreshGroups();
      showToast(t('projectDetail.teams.toast.roleChanged'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('common.error')), 'error');
    }
  };

  // Xóa mềm 1 thành viên khỏi nhóm (BE thông báo cho người bị gỡ).
  const handleRemoveMember = async (groupId: string, accountId: string) => {
    try {
      await groupApi.changeMemberStatus(groupId, accountId, { status: GroupMemberStatus.Left });
      await refreshGroups();
      showToast(t('projectDetail.teams.toast.memberRemoved'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('common.error')), 'error');
    }
  };

  const handleAssignPartner = async (groupId: string, organizationId: string) => {
    try {
      await groupApi.update(groupId, { organizationId });
      await refreshGroups();
      showToast(t('projectDetail.teams.toast.partnerAssigned'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('common.error')), 'error');
    }
  };


  /* ── Loading / error / not found ─────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-card-border bg-card py-20 shadow-card">
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {t('projectDetail.back')}
        </button>
        <div className="rounded-[var(--radius-card)] border border-danger/20 bg-danger-light p-6 text-center">
          <p className="text-sm font-medium text-danger">{error ?? t('projectDetail.notFound')}</p>
        </div>
      </div>
    );
  }

  const shortCode = project.id.slice(0, 8).toUpperCase();
  const phaseName = t(PHASE_STEPS[project.phase]?.key ?? 'projects.phase.concept');
  const progressPct = Math.round((project.phase / (PHASE_STEPS.length - 1)) * 100);

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed top-20 right-6 z-[60] animate-slide-up rounded-xl border px-5 py-3 shadow-dropdown ${toast.type === 'success' ? 'border-success/30 bg-success-light' : 'border-danger/30 bg-danger-light'}`}>
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-success' : 'text-danger'}`}>{toast.msg}</p>
        </div>
      )}

      {/* ── Back ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate('/projects')}
        className="inline-flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {t('projectDetail.back')}
      </button>

      {/* ── Hero banner ───────────────────────────────── */}
      <section className="relative h-72 overflow-hidden rounded-[32px] shadow-dropdown">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-hover to-[#2D3A28]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-8 bottom-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {t('projectDetail.heroCode')}: {shortCode}
            </span>
            <h1 className="font-display text-4xl leading-tight text-white lg:text-5xl">
              {project.projectName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
              <span>{t(PHASE_STEPS[project.phase]?.key ?? 'projects.phase.concept')}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              <span>{t(STATUS_KEYS[project.status] ?? 'projects.status.planning')}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                {t('projectDetail.basic.status')}
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {t(STATUS_KEYS[project.status] ?? 'projects.status.planning')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                {t('projectDetail.basic.phase')}
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {t(PHASE_STEPS[project.phase]?.key ?? 'projects.phase.concept')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabs ──────────────────────────────────────── */}
      <nav className="flex gap-1 overflow-x-auto border-b border-card-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.filter((item) => canViewAllTabs || ['info', 'partners', 'teams', 'documents'].includes(item.id)).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`-mb-px shrink-0 border-b-2 px-8 py-4 text-base transition-colors ${tab === item.id
              ? 'border-primary font-bold text-primary'
              : 'border-transparent font-medium text-text-secondary hover:text-primary'
              }`}
          >
            {t(item.key)}
          </button>
        ))}
      </nav>

      {/* ── Tab: Thông tin (bento layout) ─────────────── */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cột trái 2/3: cơ bản + kỹ thuật + tiến độ */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Thông tin cơ bản */}
              <div className={`${cardClass} flex flex-col gap-6`}>
                <SectionHeading
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  }
                  title={t('projectDetail.basic.title')}
                />
                <Field label={t('projectDetail.basic.name')}>
                  <span className="text-lg font-bold text-text">{project.projectName}</span>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('projectDetail.basic.code')}>
                    <span className="font-mono text-base font-semibold text-[#8A5100]">{shortCode}</span>
                  </Field>
                  <Field label={t('projectDetail.basic.type')}>
                    <NotUpdated />
                  </Field>
                </div>
                <Field label={t('projectDetail.basic.location')}>
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${project.location?.address?.trim() ? 'text-primary' : 'text-text-placeholder'}`}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {project.location?.address?.trim()
                      ? <span className="text-sm text-text">{project.location.address}</span>
                      : <NotUpdated />}
                  </span>
                </Field>
                <Field label={t('projectDetail.basic.status')}>
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_BADGE[project.status] ?? STATUS_BADGE[0]}`}>
                    {t(STATUS_KEYS[project.status] ?? 'projects.status.planning')}
                  </span>
                </Field>
                {project.projectDescription?.trim() && (
                  <Field label={t('projectDetail.basic.description')}>
                    <span className="text-sm leading-relaxed text-text-secondary">{project.projectDescription}</span>
                  </Field>
                )}
              </div>

              {/* Thông số kỹ thuật */}
              <div className={`${cardClass} flex flex-col gap-6`}>
                <SectionHeading
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  }
                  title={t('projectDetail.tech.title')}
                />
                <div className="flex flex-col gap-4">
                  <SpecMini
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                        <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                        <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                      </svg>
                    }
                    label={t('projectDetail.tech.landArea')}
                  />
                  <SpecMini
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                    }
                    label={t('projectDetail.tech.gfa')}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <SpecBox label={t('projectDetail.tech.floors')} />
                    <SpecBox label={t('projectDetail.tech.bimLevel')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tiến độ dự án */}
            <div className={`${cardClass} flex flex-col gap-6`}>
              <SectionHeading
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
                title={t('projectDetail.progress.title')}
              />
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_1fr]">
                <div className="flex flex-col gap-5">
                  <DatePoint barClass="bg-[#587F39]" label={t('projectDetail.timeline.startDate')} />
                  <DatePoint barClass="bg-[#FDA133]" label={t('projectDetail.timeline.endDate')} />
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-end justify-between gap-4">
                    <p className="flex items-end gap-1">
                      <span className="text-5xl font-bold leading-none text-primary">{project.phase + 1}</span>
                      <span className="text-2xl font-semibold text-primary/60">/ {PHASE_STEPS.length}</span>
                    </p>
                    <div className="text-right">
                      <p className="text-sm font-bold text-text">
                        {t('projectDetail.timeline.phaseLabel')}: {phaseName}
                      </p>
                      <p className="text-xs font-medium text-text-muted">{t('projectDetail.timeline.currentPhase')}</p>
                    </div>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-full bg-[#E4E3DB]">
                    <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="flex justify-between gap-1">
                    {PHASE_STEPS.map((step, idx) => (
                      <span
                        key={step.key}
                        className={`text-[10px] font-bold uppercase ${idx === project.phase ? 'text-primary underline' : idx < project.phase ? 'text-primary' : 'text-text-muted'}`}
                      >
                        {t(step.key)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải 1/3: các bên liên quan + mô hình BIM */}
          <div className="flex flex-col gap-6">
            <div className={`${cardClass} flex flex-col gap-6`}>
              <SectionHeading
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
                title={t('projectDetail.stakeholders.title')}
              />
              <div className="flex items-center gap-4 rounded-2xl border border-card-border/60 bg-input-bg/60 p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                  {(managerName ?? '?').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('projectDetail.stakeholders.manager')}
                  </p>
                  <p className="truncate text-sm font-semibold text-text">
                    {managerName ?? <span className="italic font-normal text-text-placeholder">{t('projectDetail.stakeholders.noManager')}</span>}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-card-border bg-input-bg/40 p-4 text-center">
                <p className="text-xs text-text-muted">{t('projectDetail.stakeholders.otherParties')}</p>
              </div>
            </div>

            {/* Mô hình BIM (ProjectModels) */}
            <div className={`${cardClass} flex flex-col gap-5`}>
              <SectionHeading
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                }
                title={t('projectDetail.models.title')}
              />
              {!project.models || project.models.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-card-border bg-input-bg/40 p-4 text-center text-xs text-text-muted">
                  {t('projectDetail.models.empty')}
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {project.models.map((m) => (
                    <li key={m.id} className="flex items-start gap-3 rounded-2xl border border-card-border/60 bg-input-bg/60 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text">{m.name}</p>
                        {m.description && <p className="truncate text-xs text-text-muted">{m.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Nhóm (teams) ─────────────────────────── */}
      {tab === 'teams' && (
        <div className="space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-2xl font-semibold text-primary">
              {t('projectDetail.teams.title')}
            </h2>
            {canViewAllTabs && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setManageOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {t('projectDetail.teams.manage')}
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setAddGroupOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {t('projectDetail.teams.addGroup')}
                  </button>
                )}
              </div>
            )}
          </div>

          {groupsLoading ? (
            <div className="flex items-center justify-center rounded-[24px] border border-card-border bg-card py-20 shadow-card">
              <p className="text-sm text-text-muted">{t('common.loading')}</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-card-border bg-card/70 p-16 text-center shadow-card">
              <p className="text-sm text-text-muted">{t('projectDetail.teams.empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {groups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  organizations={organizations}
                  isAdmin={isAdmin}
                  isAdminOrManager={canViewAllTabs}
                  onUpdateGroup={handleUpdateGroup}
                  onRemoveGroup={handleRemoveGroup}
                  onChangeRole={handleChangeRole}
                  onRemoveMember={handleRemoveMember}
                  onShowToast={showToast}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Tài liệu (cây thư mục CDE) ───────────── */}
      {tab === 'documents' && <DocumentsTab projectId={project.id} />}

      {tab === 'partners' && (
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-semibold text-primary">
            {t('projectDetail.tab.partners')}
          </h2>
          {projectPartners.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-card-border bg-card/70 p-16 text-center shadow-card">
              <p className="text-sm text-text-muted">{t('projectDetail.partners.empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projectPartners.map((partner) => (
                <div key={partner.id} className="flex flex-col gap-4 rounded-[24px] border border-[#C3C9B9] bg-card p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
                      {(partner.displayName || partner.legalName).charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="font-display text-lg font-bold text-text leading-snug [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden"
                        title={partner.displayName || partner.legalName}
                      >
                        {partner.displayName || partner.legalName}
                      </h3>
                      <p className="text-sm text-text-muted truncate mt-0.5">{t('projectDetail.partners.taxCode')} {partner.taxCode}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mt-2 border-t border-card-border pt-4">
                    {partner.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted shrink-0">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span className="text-text truncate" title={partner.email}>{partner.email}</span>
                      </div>
                    )}
                    {partner.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted shrink-0">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span className="text-text truncate">{partner.phone}</span>
                      </div>
                    )}
                    {partner.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted shrink-0 mt-0.5">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="text-text line-clamp-2" title={partner.address}>{partner.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Nhóm mà đối tác này quản lí */}
                  {(() => {
                    const partnerGroups = groups.filter((g) => g.organizationId === partner.id);
                    if (partnerGroups.length === 0) return null;
                    return (
                      <div className="border-t border-card-border pt-4">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">{t('projectDetail.partners.groupsLabel')}</p>
                        <div className="flex flex-wrap gap-2">
                          {partnerGroups.map((g) => (
                            <span
                              key={g.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                              </svg>
                              {g.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tabs chưa triển khai ──────────────────────── */}
      {(tab === 'packages' || tab === 'settings') && (
        <ComingSoon />
      )}

      {/* ── Modal: Quản trị dự án (chỉ định + mời) ─────── */}
      {manageOpen && (
        <Modal title={t('projectDetail.teams.manageTitle')} onClose={() => setManageOpen(false)}>
          <ManageProjectPanel
            projectId={project.id}
            accounts={accounts}
            groups={groups}
            loadingGroups={groupsLoading}
            currentManagerId={project.managerAccountId}
            onAssign={handleAssign}
            onInvite={handleInvite}
            onAssignPartner={handleAssignPartner}
          />
        </Modal>
      )}

      {/* ── Modal: Thêm nhóm mới ──────────────────────── */}
      {addGroupOpen && (
        <Modal title={t('projectDetail.teams.groupForm.title')} onClose={() => setAddGroupOpen(false)}>
          <CreateGroupForm onSubmit={handleAddGroup} onCancel={() => setAddGroupOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
