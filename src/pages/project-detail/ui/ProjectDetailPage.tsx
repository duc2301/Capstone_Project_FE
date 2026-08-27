import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import type { ContractPackage } from '@/entities/contractPackage';
import { contractPackageApi } from '@/entities/contractPackage';
import type { CreateGroupPayload, Group } from '@/entities/group';
import { groupApi, GroupMemberStatus } from '@/entities/group';
import { GroupMemberRole } from '@/entities/invitation';
import type { Organization } from '@/entities/organization';
import { isAccountAdmin, useSession } from '@/entities/session';
import { DocumentsTab } from '@/features/folders';
import { ProjectIssuesTab } from '@/features/issues';
import { FolderNamingInfoModal } from '@/features/naming-conventions';
import { useOrganizations } from '@/features/organizations';
import { packageStatusMeta, PackageFormModal, usePackages } from '@/features/packages';
import type { AddGroupInput } from '@/features/projects';
import {
  CreateGroupForm,
  EditGroupModal,
  EditProjectForm,
  GroupDetailPanel,
  ManageProjectPanel,
  ProjectPartnersTab,
  useProjectDetail,
  useProjectFileBundle,
  useProjectGroups,
  useProjectInvite,
} from '@/features/projects';
import { AuditLogPanel } from '@/features/audit-logs';
import { ProjectSettingsHub } from '@/widgets/ProjectSettingsHub';
import { getApiErrorMessage } from '@/shared/api';
import { ActionIconButton, ConfirmDialog, DeleteIcon, EditIcon, Modal, RowActions, Toast, ToolbarIconButton, UserAvatar, useToast } from '@/shared/components';
import { formatDate, formatRelativeTime } from '@/shared/lib/format';
import { useUrlTab } from '@/shared/lib/url';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

type TabId = 'info' | 'partners' | 'packages' | 'teams' | 'documents' | 'issues' | 'audit' | 'settings';
const TAB_IDS = ['info', 'partners', 'packages', 'teams', 'documents', 'issues', 'audit', 'settings'] as const;
const TABS: { id: TabId; key: TranslationKey }[] = [
  { id: 'info', key: 'projectDetail.tab.info' },
  { id: 'partners', key: 'projectDetail.tab.partners' },
  { id: 'packages', key: 'projectDetail.tab.packages' },
  { id: 'teams', key: 'projectDetail.tab.teams' },
  { id: 'documents', key: 'projectDetail.tab.documents' },
  { id: 'issues', key: 'projectDetail.tab.issues' },
  { id: 'audit', key: 'projectDetail.tab.audit' },
  { id: 'settings', key: 'projectDetail.tab.settings' },
];

const cardClass =
  'rounded-[var(--radius-card-lg)] border border-card-border/60 bg-card/70 p-6 shadow-card backdrop-blur-sm';

/* ── Small presentational helpers ──────────────────────── */
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-card-border/50 bg-input-bg px-6 py-5">
      <p className="text-2xs uppercase tracking-[1px] text-text-secondary/60">{label}</p>
      <p className="mt-1 truncate font-display text-xl leading-[33px] text-primary">{value}</p>
    </div>
  );
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <p className="shrink-0 text-sm font-semibold text-text-secondary">{label}</p>
      <p className="text-right text-base font-medium text-text">{value}</p>
    </div>
  );
}

function ProjectMap({
  latitude,
  longitude,
  label,
}: {
  latitude: number | null;
  longitude: number | null;
  label: string;
}) {
  if (latitude === null || longitude === null) {
    return (
      <div className="mt-4 flex h-40 items-center justify-center rounded-sm border border-card-border/50 bg-input-bg">
        <p className="text-sm italic text-text-placeholder">{t('projectDetail.location.noCoordinates')}</p>
      </div>
    );
  }

  const delta = 0.01;
  const bbox = [longitude - delta, latitude - delta, longitude + delta, latitude + delta].join(',');

  return (
    <div className="mt-4 space-y-2">
      <div className="h-40 overflow-hidden rounded-sm border border-card-border/50">
        <iframe
          title={label}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`}
          className="h-[186px] w-full border-0"
          loading="lazy"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <a
          href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          {t('projectDetail.location.openMap')}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        <span className="text-2xs text-text-placeholder">© OpenStreetMap</span>
      </div>
    </div>
  );
}

/* ── Group (team) card ─────────────────────────────────── */
function GroupCard({
  group,
  organizations,
  isAdmin,
  isAdminOrManager,
  onOpen,
  onUpdateGroup,
  onRemoveGroup,
  onShowToast,
}: {
  group: Group;
  organizations: Organization[];
  isAdmin: boolean;
  isAdminOrManager: boolean;
  onOpen: (groupId: string) => void;
  onUpdateGroup: (groupId: string, payload: Partial<CreateGroupPayload>) => Promise<void>;
  onRemoveGroup: (groupId: string) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [editGroupModalOpen, setEditGroupModalOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removingGroup, setRemovingGroup] = useState(false);

  const partner = organizations.find(o => o.id === group.organizationId);
  const partnerNames = partner ? (partner.displayName || partner.legalName) : '';

  const activeMemberCount = group.members.filter((m) => m.status !== GroupMemberStatus.Left).length;

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-card-lg)] border border-border-sage bg-card p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
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
            <h3 className="heading-entity">{group.name}</h3>
            {group.description && <p className="text-sm text-text-muted mt-0.5">{group.description}</p>}
          </div>
        </div>
        <RowActions>
          {isAdminOrManager && (
            <ActionIconButton
              label={t('projectDetail.teams.editGroup')}
              tone="primary"
              icon={<EditIcon />}
              onClick={() => setEditGroupModalOpen(true)}
            />
          )}
          {isAdmin && (
            <ActionIconButton
              label={t('projectDetail.teams.removeGroup')}
              tone="danger"
              icon={<DeleteIcon />}
              onClick={() => setRemoveConfirmOpen(true)}
            />
          )}
        </RowActions>
      </div>

      <div className="flex flex-col gap-2">
        {partnerNames && (
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
              {t('projectDetail.partners.managedBy')} <span className="font-bold text-text">{partnerNames}</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <span>
            {activeMemberCount} {t('projectDetail.teams.membersSuffix')}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(group.id)}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[rgba(88,127,57,0.1)] py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
      >
        {t('projectDetail.teams.viewDetail')}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {editGroupModalOpen && (
        <EditGroupModal
          group={group}
          onClose={() => setEditGroupModalOpen(false)}
          onSubmit={async (groupId, payload) => {
            await onUpdateGroup(groupId, payload);
            onShowToast(t('projectDetail.teams.toast.groupUpdated'));
          }}
          onError={(msg) => onShowToast(msg, 'error')}
        />
      )}

      {removeConfirmOpen && (
        <ConfirmDialog
          title={t('projectDetail.teams.removeGroup.title')}
          message={t('projectDetail.teams.removeGroup.desc')}
          confirmLabel={t('projectDetail.teams.removeGroup.submit')}
          cancelLabel={t('projectDetail.teams.removeGroup.cancel')}
          tone="danger"
          busy={removingGroup}
          onConfirm={async () => {
            try {
              setRemovingGroup(true);
              await onRemoveGroup(group.id);
              setRemoveConfirmOpen(false);
            } finally {
              setRemovingGroup(false);
            }
          }}
          onCancel={() => setRemoveConfirmOpen(false)}
        />
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { project, loading, error, refresh, assignManager } = useProjectDetail(projectId);
  const { accounts, inviteMany } = useProjectInvite();
  const { groups, loading: groupsLoading, addGroup, removeGroup, refresh: refreshGroups } = useProjectGroups(projectId);
  const { organizations } = useOrganizations();

  // Tính toán danh sách đối tác đã tham gia dự án
  const projectPartners = useMemo(() => {
    const orgIds = new Set(groups.map((g) => g.organizationId).filter(Boolean));
    return organizations.filter((org) => orgIds.has(org.id));
  }, [groups, organizations]);

  const { currentUser } = useSession();

  const [tab, selectTab] = useUrlTab(TAB_IDS, 'info');
  const [searchParams, setSearchParams] = useSearchParams();
  const openedGroupId = searchParams.get('group');
  const [manageOpen, setManageOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [createPackageOpen, setCreatePackageOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ContractPackage | null>(null);

  const { packages, loading: pkgLoading } = usePackages(projectId);

  const managerName = useMemo(() => {
    if (!project?.managerAccountId) return null;
    return accounts.find((a) => a.id === project.managerAccountId)?.userName ?? project.managerAccountId;
  }, [accounts, project]);

  const managerAccount = useMemo(
    () => (project?.managerAccountId ? accounts.find((a) => a.id === project.managerAccountId) ?? null : null),
    [accounts, project],
  );

  const memberCount = useMemo(() => {
    const ids = new Set<string>();
    groups.forEach((g) => g.members
      .filter((m) => m.status === GroupMemberStatus.Active)
      .forEach((m) => ids.add(m.accountId)));
    return ids.size;
  }, [groups]);

  const contractValueText = useMemo(() => {
    const total = packages.reduce((sum, p) => sum + (p.contractValue ?? 0), 0);
    if (total <= 0) return null;
    const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(v);
    if (total >= 1_000_000_000) return `${fmt(total / 1_000_000_000)} ${t('projectDetail.currency.billion')}`;
    if (total >= 1_000_000) return `${fmt(total / 1_000_000)} ${t('projectDetail.currency.million')}`;
    return `${fmt(total)} ${t('projectDetail.currency.dong')}`;
  }, [packages]);

  const isAdmin = isAccountAdmin(currentUser?.role);
  const isManager = project?.managerAccountId === currentUser?.accountId;
  const canViewAllTabs = isAdmin || isManager;

  const openedGroup = useMemo(
    () => (openedGroupId ? groups.find((g) => g.id === openedGroupId) ?? null : null),
    [groups, openedGroupId],
  );

  const openGroup = useCallback((groupId: string | null) => {
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      if (groupId) next.set('group', groupId);
      else next.delete('group');
      return next;
    });
  }, [setSearchParams]);
  // Leader active của ít nhất 1 group trong project — được vào tab Cài đặt (bản rút gọn).
  const isProjectLeader = groups.some((g) =>
    g.members.some(
      (m) =>
        m.accountId === currentUser?.accountId
        && m.role === GroupMemberRole.Leader
        && m.status === GroupMemberStatus.Active,
    ));

  const { toast, showToast } = useToast();

  const { downloading: bundleDownloading, downloadBundle } = useProjectFileBundle(projectId);

  const handleDownloadBundle = async () => {
    showToast(t('projectDetail.bundle.started'));
    try {
      await downloadBundle();
      showToast(t('projectDetail.bundle.done'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('projectDetail.bundle.error'), 'error');
    }
  };

  const handleProjectSaved = async () => {
    setEditOpen(false);
    await refresh();
    showToast(t('projectDetail.actions.saved'));
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
    const group = groups.find(g => g.id === groupId);
    if (group?.organizationId === organizationId) return;

    await groupApi.update(groupId, { organizationId });
    await refreshGroups();
    showToast(t('projectDetail.teams.toast.partnerAssigned'));
  };


  /* ── Loading / error / not found ─────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-card-border bg-card py-14 shadow-card">
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

  return (
    <>
      <Toast toast={toast} className="z-[60]" />

      <header className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pb-3">
        <h1 className="heading-page text-text">{project.projectName}</h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm font-semibold text-text-secondary/80">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
              <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
            </svg>
            {t('projectDetail.basic.code')}: {project.projectCode?.trim() || shortCode}
          </span>
          {project.updatedAt && (
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {t('projectDetail.header.updated')}: {formatRelativeTime(project.updatedAt)}
            </span>
          )}
        </div>
      </header>

      {/* Navbar dự án: kéo âm để huỷ padding của <main> cho thanh tab chạm mép */}
      <nav className="-mx-6 mb-4 flex shrink-0 gap-8 overflow-x-auto border-b border-card-border/60 px-6 [scrollbar-width:none] lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden">
        {TABS.filter((item) => (item.id === 'settings'
          ? isAdmin || isManager || isProjectLeader // quy tắc đặt tên: Admin/PM full, Leader bản rút gọn
          : canViewAllTabs || ['info', 'partners', 'teams', 'documents', 'issues', 'audit'].includes(item.id))).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              className={`-mb-px shrink-0 border-b-2 py-3 text-sm font-semibold tracking-[0.01em] transition-colors ${tab === item.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary/70 hover:text-primary'
                }`}
            >
              {t(item.key)}
            </button>
          ))}
      </nav>

      {/* Nội dung tab tự cuộn -> thanh tab nằm ngoài vùng cuộn nên đứng yên */}
      <div className="admin-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
      {/* ── Tab: Thông tin ─────────────── */}
      {tab === 'info' && (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_384px]">
          <div className="space-y-10">
            <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-card-border/60">
              {project.projectImageUrl?.trim() ? (
                <img
                  src={project.projectImageUrl}
                  alt={project.projectName}
                  className="h-[340px] w-full object-cover"
                />
              ) : (
                <div className="flex h-[340px] w-full items-center justify-center bg-primary-light">
                  <span className="font-display text-6xl font-semibold text-primary/50">
                    {project.projectName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/90 px-3 py-1 text-2xs font-bold uppercase tracking-[1px] text-white backdrop-blur-sm">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
                    <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
                  </svg>
                  {t('projectDetail.basic.code')}: {project.projectCode?.trim() || shortCode}
                </span>
                <h2 className="heading-tab mt-2 text-white lg:text-[2.5rem]">
                  {project.projectName}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
                  <span className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    {project.location?.address?.trim() || project.contactAddress?.trim() || t('projectDetail.common.notUpdated')}
                  </span>
                  {project.createdAt && (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                      <span className="flex items-center gap-1.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {t('projectDetail.basic.createdAt')}: {formatDate(project.createdAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </section>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatBox label={t('projectDetail.stats.contractValue')} value={contractValueText ?? t('projectDetail.common.notUpdated')} />
              <StatBox label={t('projectDetail.stats.members')} value={`${memberCount} ${t('projectDetail.stats.membersUnit')}`} />
              <StatBox label={t('projectDetail.stats.packages')} value={String(packages.length)} />
              <StatBox label={t('projectDetail.stats.groups')} value={String(groups.length)} />
            </div>

            <section className="space-y-5">
              <h3 className="heading-page">
                {t('projectDetail.description.title')}
              </h3>
              <p className="max-w-3xl whitespace-pre-line text-base leading-[1.65] text-text/80">
                {project.projectDescription?.trim() || t('projectDetail.description.empty')}
              </p>
            </section>
          </div>

          <aside className="space-y-8">
            <section>
              <h3 className="heading-eyebrow border-b border-text/10 pb-4">
                {t('projectDetail.sidebar.manager')}
              </h3>
              <div className="mt-6 flex items-center gap-4 rounded-lg border border-card-border/50 bg-input-bg p-3">
                <UserAvatar
                  userName={managerName ?? '?'}
                  avatarUrl={managerAccount?.avatarUrl}
                  size="lg"
                  rounded="full"
                  className="border-2 border-primary/20"
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-xl font-normal text-text">
                    {managerName ?? t('projectDetail.stakeholders.noManager')}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-primary">{t('projectDetail.stakeholders.manager')}</p>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between border-b border-text/10 pb-4">
                <h3 className="heading-eyebrow">
                  {t('projectDetail.sidebar.details')}
                </h3>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.6px] text-primary">
                      {t('projectDetail.basic.owner')}
                    </p>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                      <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" />
                      <path d="M9 21v-6h6v6" />
                    </svg>
                  </div>
                  <p className="mt-1.5 text-lg font-bold leading-snug text-primary">
                    {project.ownerOrganizationName?.trim() || t('projectDetail.common.notUpdated')}
                  </p>
                </div>

                <SidebarRow
                  label={t('projectDetail.basic.contactAddress')}
                  value={project.contactAddress?.trim() || t('projectDetail.common.notUpdated')}
                />
                <SidebarRow
                  label={t('projectDetail.basic.createdAt')}
                  value={project.createdAt ? formatDate(project.createdAt) : t('projectDetail.common.notUpdated')}
                />
                <SidebarRow
                  label={t('projectDetail.basic.updatedAt')}
                  value={project.updatedAt ? formatDate(project.updatedAt) : t('projectDetail.common.notUpdated')}
                />
              </div>
            </section>

            <section>
              <h3 className="heading-eyebrow border-b border-text/10 pb-4">
                {t('projectDetail.sidebar.location')}
              </h3>

              <div className="mt-6 flex items-start gap-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-primary">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <p className="text-sm font-semibold leading-snug text-text">
                  {project.location?.address?.trim() || t('projectDetail.common.notUpdated')}
                </p>
              </div>

              <ProjectMap
                latitude={project.location?.latitude ?? null}
                longitude={project.location?.longitude ?? null}
                label={project.location?.address ?? project.projectName}
              />
            </section>

            {canViewAllTabs && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-card-border/50 px-6 py-3 text-base font-medium text-text transition-colors hover:bg-content-bg"
                >
                  <EditIcon size={14} />
                  {t('projectDetail.actions.edit')}
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => void handleDownloadBundle()}
                    disabled={bundleDownloading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-card-border/50 px-6 py-3 text-base font-medium text-text transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {bundleDownloading ? t('projectDetail.bundle.preparing') : t('projectDetail.bundle.action')}
                  </button>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      {tab === 'teams' && openedGroup && (
        <GroupDetailPanel
          projectId={projectId!}
          group={openedGroup}
          projectGroups={groups}
          organizations={organizations}
          accounts={accounts}
          canManage={canViewAllTabs}
          canChangeRole={canViewAllTabs}
          onBack={() => openGroup(null)}
          onUpdateGroup={handleUpdateGroup}
          onChangeRole={handleChangeRole}
          onRemoveMember={handleRemoveMember}
          onInvite={handleInvite}
          onShowToast={showToast}
        />
      )}

      {/* ── Tab: Nhóm (teams) ─────────────────────────── */}
      {tab === 'teams' && !openedGroup && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="heading-tab">
              {t('projectDetail.teams.title')}
            </h2>
            {canViewAllTabs && (
              <div className="flex flex-wrap items-center gap-3">
                <ToolbarIconButton
                  showLabel
                  label={t('projectDetail.teams.manage')}
                  onClick={() => setManageOpen(true)}
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  }
                />
                {canViewAllTabs && (
                  <button
                    type="button"
                    onClick={() => setAddGroupOpen(true)}
                    className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
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
            <div className="flex items-center justify-center rounded-[var(--radius-card-lg)] border border-card-border bg-card py-14 shadow-card">
              <p className="text-sm text-text-muted">{t('common.loading')}</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-[var(--radius-card-lg)] border border-dashed border-card-border bg-card/70 p-10 text-center shadow-card">
              <p className="text-sm text-text-muted">{t('projectDetail.teams.empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {groups.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  organizations={organizations}
                  isAdmin={isAdmin}
                  isAdminOrManager={canViewAllTabs}
                  onOpen={openGroup}
                  onUpdateGroup={handleUpdateGroup}
                  onRemoveGroup={handleRemoveGroup}
                  onShowToast={showToast}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Tài liệu (cây thư mục CDE) ───────────── */}
      {tab === 'documents' && (
        <DocumentsTab
          projectId={project.id}
          isProjectManager={!!currentUser?.accountId && project.managerAccountId === currentUser.accountId}
          signerGroups={groups}
          signerGroupsLoading={groupsLoading}
          renderNamingModal={({ folder, canManage, close, notify }) => (
            <FolderNamingInfoModal
              folder={folder}
              canManage={canManage}
              onClose={close}
              onInherited={() => {
                close();
                notify(t('naming.folder.inherited'));
              }}
              onCustomized={() => {
                close();
                notify(t('naming.folder.customized'));
              }}
            />
          )}
        />
      )}

      {tab === 'issues' && <ProjectIssuesTab projectId={project.id} />}

      {tab === 'partners' && (
        <ProjectPartnersTab
          partners={projectPartners}
          groups={groups}
          organizations={organizations}
          canManage={canViewAllTabs}
          onAssignPartner={handleAssignPartner}
        />
      )}

      {/* ── Tab: Nhật ký hoạt động ──────
          Admin/PM -> toàn bộ log dự án. Thành viên thường -> endpoint /my,
          BE tự lọc chỉ còn log của thư mục họ có quyền xem + nhóm họ tham gia. */}
      {tab === 'audit' && (
        <AuditLogPanel
          mode={canViewAllTabs ? 'project' : 'my'}
          projectId={project.id}
          heading={<h2 className="heading-tab shrink-0">{t('projectDetail.tab.audit')}</h2>}
        />
      )}

      {/* ── Tab: Cài đặt (quy tắc đặt tên tệp) — Admin/PM full, Leader bản rút gọn ── */}
      {tab === 'settings' && (isAdmin || isManager || isProjectLeader) && (
        <ProjectSettingsHub projectId={project.id} canConfigure={canViewAllTabs} />
      )}

      {/* ── Tab: Packages ───────────── */}
      {tab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="heading-tab">{t('projectDetail.packages.listTitle')}</h2>
            <button
              onClick={() => {
                setEditingPackage(null);
                setCreatePackageOpen(true);
              }}
              className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover shadow-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('packages.createNew')}
            </button>
          </div>

          <div className={`${cardClass} overflow-x-auto`}>
            <table className="table-list min-w-[1040px] text-left">
              <colgroup>
                <col />
                <col className="w-[150px]" />
                <col className="w-[20%]" />
                <col className="w-[124px]" />
                <col className="w-[124px]" />
                <col className="w-[130px]" />
                <col className="w-[90px]" />
              </colgroup>
              <thead>
                <tr className="table-head">
                  <th className="pb-3">{t('packages.col.name')}</th>
                  <th className="pb-3">{t('packages.col.code')}</th>
                  <th className="pb-3">{t('packages.col.contractor')}</th>
                  <th className="pb-3 text-center">{t('packages.col.startDate')}</th>
                  <th className="pb-3 text-center">{t('packages.col.endDate')}</th>
                  <th className="pb-3">{t('packages.col.status')}</th>
                  <th className="pb-3 text-right">{t('common.col.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border text-text">
                {pkgLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted italic">{t('common.loading')}</td>
                  </tr>
                ) : packages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted italic">{t('packages.empty')}</td>
                  </tr>
                ) : packages.map(p => {
                  const mainContractor = p.assignments?.find(a => Number(a.role) === 0 || String(a.role) === 'MainContractor');
                  const partnerName = mainContractor
                    ? (organizations.find(o => o.id === mainContractor.organizationId)?.displayName || t('packages.contractor.updating'))
                    : t('packages.contractor.unassigned');
                  const pkgStatus = packageStatusMeta(p.status);
                  return (
                    <tr key={p.id} className="hover:bg-card-hover transition-colors cursor-pointer" onClick={() => navigate(`/projects/${project.id}/packages/${p.id}`)}>
                      <td className="cell-wrap py-4 pr-4 align-top font-medium text-primary" title={p.name}>
                        <span className="hover:underline">{p.name}</span>
                      </td>
                      <td className="cell-wrap py-4 pr-4 align-top font-bold text-primary">{p.code}</td>
                      <td className="cell-wrap py-4 pr-4 align-top text-text-muted">{partnerName}</td>
                      <td className="py-4 text-center align-top">{p.startDate ? formatDate(p.startDate) : '—'}</td>
                      <td className="py-4 text-center align-top">{p.endDate ? formatDate(p.endDate) : '—'}</td>
                      <td className="py-4 align-top">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${pkgStatus.badgeClass}`}>
                          {pkgStatus.label}
                        </span>
                      </td>
                      <td className="py-4 align-top">
                        <RowActions>
                          <ActionIconButton
                            label={t('packages.action.edit')}
                            tone="primary"
                            icon={<EditIcon />}
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const res = await contractPackageApi.getById(p.id);
                                if (res.data?.result) {
                                  setEditingPackage(res.data.result);
                                  setCreatePackageOpen(true);
                                }
                              } catch (error) {
                                console.error('Failed to fetch package details', error);
                              }
                            }}
                          />
                        </RowActions>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
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

      {editOpen && (
        <Modal
          title={t('projectDetail.actions.editTitle')}
          onClose={() => setEditOpen(false)}
          maxWidth="max-w-4xl"
        >
          <EditProjectForm
            project={project}
            organizations={organizations}
            onSaved={handleProjectSaved}
            onCancel={() => setEditOpen(false)}
          />
        </Modal>
      )}

      {/* ── Modal: Thêm nhóm mới ──────────────────────── */}
      {addGroupOpen && (
        <Modal title={t('projectDetail.teams.groupForm.title')} onClose={() => setAddGroupOpen(false)}>
          <CreateGroupForm onSubmit={handleAddGroup} onCancel={() => setAddGroupOpen(false)} />
        </Modal>
      )}

      {/* Modal: Tạo / Sửa gói thầu */}
      <PackageFormModal
        isOpen={createPackageOpen}
        onClose={() => {
          setCreatePackageOpen(false);
          setEditingPackage(null);
        }}
        projectId={project.id}
        initialData={editingPackage || undefined}
        accounts={accounts}
        onSuccess={(msg, packageId) => {
          showToast(msg);
          if (packageId) {
            window.location.href = `/projects/${project.id}/packages/${packageId}`;
          } else {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', 'packages');
            window.location.href = url.toString();
          }
        }}
        onError={(msg) => showToast(msg, 'error')}
      />
      </div>
    </>
  );
}
