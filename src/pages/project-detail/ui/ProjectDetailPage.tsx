import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { Group, GroupMember } from '@/entities/group';
import { GroupMemberRole } from '@/entities/invitation';
import type { AddGroupInput } from '@/features/projects';
import {
  CreateGroupForm,
  ManageProjectPanel,
  useProjectDetail,
  useProjectGroups,
  useProjectInvite,
} from '@/features/projects';
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
function MemberRow({ member }: { member: GroupMember }) {
  const isLeader = member.role === GroupMemberRole.Leader;
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
        {member.userName.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{member.userName}</p>
        {member.email && <p className="truncate text-xs text-text-muted">{member.email}</p>}
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          isLeader ? 'bg-primary text-white' : 'bg-content-bg text-text-secondary'
        }`}
      >
        {isLeader ? t('projectDetail.teams.role.leader') : t('projectDetail.teams.role.member')}
      </span>
    </div>
  );
}

/* ── Group (team) card ─────────────────────────────────── */
function GroupCard({ group }: { group: Group }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-[#C3C9B9] bg-card p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </span>
        <h3 className="font-display text-xl text-primary">{group.name}</h3>
      </div>

      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
        <span>
          {group.members.length} {t('projectDetail.teams.membersSuffix')}
        </span>
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
          {group.members.length === 0 ? (
            <p className="text-sm text-text-muted">{t('projectDetail.teams.noMembers')}</p>
          ) : (
            group.members.map((m) => <MemberRow key={m.accountId} member={m} />)
          )}
        </div>
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
  const { groups, loading: groupsLoading, addGroup } = useProjectGroups(projectId);

  const [tab, setTab] = useState<TabId>('info');
  const [manageOpen, setManageOpen] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const managerName = useMemo(() => {
    if (!project?.managerAccountId) return null;
    return accounts.find((a) => a.id === project.managerAccountId)?.userName ?? project.managerAccountId;
  }, [accounts, project]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAssign = async (payload: Parameters<typeof assignManager>[0]) => {
    try {
      await assignManager(payload);
      showToast(t('projects.toast.managerAssigned'));
    } catch {
      showToast(t('common.error'), 'error');
    }
  };

  const handleInvite = async (input: Parameters<typeof inviteMany>[0]) => {
    const result = await inviteMany(input);
    if (result.sent === 0) {
      showToast(t('common.error'), 'error');
    } else if (result.failed > 0) {
      showToast(t('projects.toast.invitedPartial'), 'error');
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
    } catch {
      showToast(t('common.error'), 'error');
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
      <nav className="flex gap-1 overflow-x-auto border-b border-card-border">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`-mb-px shrink-0 border-b-2 px-8 py-4 text-base transition-colors ${
              tab === item.id
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
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setManageOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {t('projectDetail.teams.manage')}
              </button>
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
            </div>
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
                <GroupCard key={g.id} group={g} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tabs chưa triển khai ──────────────────────── */}
      {(tab === 'partners' || tab === 'packages' || tab === 'documents' || tab === 'settings') && (
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
