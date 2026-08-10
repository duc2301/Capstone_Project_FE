import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useDashboard } from '@/features/dashboard';
import type { DeadlineItem, MyProjectItem, WorkItem, WorkItemKind } from '@/features/dashboard';
import { fromDateKey, toDateKey, ToolbarIconButton } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import type { TranslationKey } from '@/shared/lib/i18n';

type Tone = 'warning' | 'danger' | 'primary' | 'info' | 'neutral';

const TONE_SOFT: Record<Tone, string> = {
  warning: 'bg-accent-amber/10 text-accent-amber',
  danger: 'bg-danger-strong/10 text-danger-strong',
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info/10 text-info',
  neutral: 'bg-surface-sand-light text-text-secondary',
};

const TONE_CHIP: Record<Tone, string> = {
  warning: 'border-accent-amber/20 bg-accent-amber/10 text-accent-amber',
  danger: 'border-danger-strong/20 bg-danger-strong/10 text-danger-strong',
  primary: 'border-primary/20 bg-primary/10 text-primary',
  info: 'border-info/20 bg-info/10 text-info',
  neutral: 'border-border-sage/20 bg-surface-sand-light text-text-secondary',
};

const TONE_RAIL: Record<Tone, string> = {
  warning: 'bg-accent-amber',
  danger: 'bg-danger-strong',
  primary: 'bg-primary',
  info: 'bg-info',
  neutral: 'bg-border-sage',
};

const WORK_ITEM_META: Record<WorkItemKind, { labelKey: TranslationKey; tone: Tone; icon: ReactNode }> = {
  approval: {
    labelKey: 'dashboard.queue.kind.approval',
    tone: 'warning',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  signature: {
    labelKey: 'dashboard.queue.kind.signature',
    tone: 'danger',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
  submitted: {
    labelKey: 'dashboard.queue.kind.submitted',
    tone: 'neutral',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
  },
  returnRequest: {
    labelKey: 'dashboard.queue.kind.returnRequest',
    tone: 'danger',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 14 4 9 9 4" />
        <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
      </svg>
    ),
  },
  invitation: {
    labelKey: 'dashboard.queue.kind.invitation',
    tone: 'primary',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
  issue: {
    labelKey: 'dashboard.queue.kind.issue',
    tone: 'info',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
};

function waitingLabel(days: number): string {
  if (days <= 0) return t('dashboard.queue.today');
  return `${t('dashboard.queue.waitingPrefix')} ${days} ${t('dashboard.queue.daysSuffix')}`;
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function Chip({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-bold ${TONE_CHIP[tone]}`}
    >
      {children}
    </span>
  );
}

function BentoCard({
  title,
  icon,
  tone,
  action,
  count,
  children,
  className = '',
}: {
  title: string;
  icon: ReactNode;
  tone: Tone;
  action?: ReactNode;
  count?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-border-sage/30 bg-card shadow-card ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-sage/20 px-5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONE_SOFT[tone]}`}>
            {icon}
          </span>
          <h2 className="heading-entity truncate text-text-strong">{title}</h2>
          {count !== undefined && count > 0 && (
            <span className="shrink-0 rounded-[var(--radius-badge)] bg-surface-sand-light px-2 py-0.5 text-xs font-bold text-text-secondary">
              {count}
            </span>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function CardLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
    >
      {label}
      <ChevronIcon />
    </Link>
  );
}

function EmptyState({ message, tone = 'muted' }: { message: string; tone?: 'muted' | 'danger' }) {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-8 text-center">
      <p className={tone === 'danger' ? 'modal-text text-danger' : 'modal-text'}>{message}</p>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
  icon,
  badge,
  to,
}: {
  label: string;
  value: number;
  tone: Tone;
  icon: ReactNode;
  badge?: string;
  to?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border-sage/30 bg-card px-3.5 py-2.5 transition-colors hover:border-primary/30">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE_SOFT[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-normal leading-tight text-text-strong">{value}</span>
          {badge && (
            <span
              className={`shrink-0 rounded-[var(--radius-badge)] px-2 py-0.5 text-2xs font-bold ${TONE_SOFT[tone]}`}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="field-hint truncate">{label}</p>
      </div>
    </div>
  );

  if (!to) return content;
  return (
    <Link to={to} className="block">
      {content}
    </Link>
  );
}

function WorkItemRow({ item }: { item: WorkItem }) {
  const meta = WORK_ITEM_META[item.kind];

  const content = (
    <div className="flex items-center gap-2.5 rounded-[var(--radius-input)] border border-border-sage/50 bg-card px-3 py-2 transition-colors hover:border-primary/40 hover:bg-content-bg/40">
      <span className={`h-8 w-1 shrink-0 rounded-full ${TONE_RAIL[meta.tone]}`} />
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_SOFT[meta.tone]}`}>
        {meta.icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-5 text-text-strong">{item.title}</p>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
          <Chip>{t(meta.labelKey)}</Chip>
          <Chip>
            <ClockIcon />
            {waitingLabel(item.waitingDays)}
          </Chip>
          {item.context && <span className="field-hint min-w-0 truncate">{item.context}</span>}
        </div>
      </div>

      {item.link && (
        <span className="flex shrink-0 items-center text-text-muted">
          <ChevronIcon />
        </span>
      )}
    </div>
  );

  if (!item.link) return content;
  return (
    <Link to={item.link} className="block">
      {content}
    </Link>
  );
}

function deadlineLabel(item: DeadlineItem): string {
  if (item.isOverdue) {
    return t('dashboard.schedule.overdueDays').replace('{count}', String(Math.abs(item.daysLeft)));
  }
  if (item.daysLeft === 0) return t('dashboard.schedule.today');
  if (item.daysLeft === 1) return t('dashboard.schedule.tomorrow');
  return t('dashboard.schedule.inDays').replace('{count}', String(item.daysLeft));
}

function formatDueDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

const WEEKDAY_KEYS: TranslationKey[] = [
  'dashboard.schedule.weekday.mon',
  'dashboard.schedule.weekday.tue',
  'dashboard.schedule.weekday.wed',
  'dashboard.schedule.weekday.thu',
  'dashboard.schedule.weekday.fri',
  'dashboard.schedule.weekday.sat',
  'dashboard.schedule.weekday.sun',
];

function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const shift = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - shift);
  return start;
}

function addDays(date: Date, count: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

function WeekCalendar({
  weekStart,
  selectedKey,
  todayKey,
  countByDay,
  onSelect,
  onShiftWeek,
}: {
  weekStart: Date;
  selectedKey: string;
  todayKey: string;
  countByDay: Map<string, number>;
  onSelect: (key: string) => void;
  onShiftWeek: (delta: number) => void;
}) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const monthLabel = t('dashboard.schedule.monthLabel')
    .replace('{month}', String(weekStart.getMonth() + 1))
    .replace('{year}', String(weekStart.getFullYear()));

  return (
    <div className="shrink-0 border-b border-border-sage/20 px-3 py-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <ToolbarIconButton
          size="xs"
          variant="ghost"
          label={t('dashboard.schedule.prevWeek')}
          onClick={() => onShiftWeek(-1)}
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          }
        />
        <button
          type="button"
          onClick={() => onSelect(todayKey)}
          title={t('dashboard.schedule.thisWeek')}
          className="min-w-0 truncate text-xs font-bold leading-5 text-text-secondary transition-colors hover:text-primary"
        >
          {monthLabel}
        </button>
        <ToolbarIconButton
          size="xs"
          variant="ghost"
          label={t('dashboard.schedule.nextWeek')}
          onClick={() => onShiftWeek(1)}
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const key = toDateKey(day);
          const count = countByDay.get(key) ?? 0;
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const isPast = key < todayKey;
          const dotTone = count === 0 ? '' : isPast ? 'bg-danger-strong' : 'bg-primary';

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-0.5 rounded-lg py-1 transition-colors ${
                isSelected
                  ? 'bg-primary text-white'
                  : isToday
                    ? 'bg-primary-ghost text-primary'
                    : 'text-text-secondary hover:bg-content-bg'
              }`}
            >
              <span className="text-2xs font-bold leading-3">{t(WEEKDAY_KEYS[index])}</span>
              <span className="text-xs font-bold leading-4">{day.getDate()}</span>
              <span className={`h-1 w-1 rounded-full ${isSelected && count > 0 ? 'bg-white' : dotTone}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DeadlineRow({ item }: { item: DeadlineItem }) {
  const tone: Tone = item.isOverdue ? 'danger' : item.daysLeft <= 1 ? 'warning' : 'primary';
  return (
    <Link
      to={item.link}
      className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border-sage/40 bg-card p-3 transition-colors hover:border-primary/40 hover:bg-content-bg/40"
    >
      <span
        className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-sm font-bold ${TONE_SOFT[tone]}`}
      >
        {formatDueDate(item.dueDate)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-strong">{item.title}</p>
        <p className="field-hint truncate">{item.context || deadlineLabel(item)}</p>
      </div>
      <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${TONE_CHIP[tone]}`}>
        {deadlineLabel(item)}
      </span>
    </Link>
  );
}

function ProjectRow({ project }: { project: MyProjectItem }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[var(--radius-input)] border border-border-sage/40 bg-card p-2.5 transition-colors hover:border-primary/40">
      <Link to={`/projects/${project.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sand-light text-text-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4v18" />
            <path d="M19 21V11l-6-4" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-strong">{project.name}</p>
          <p className="field-hint truncate">
            {project.code ? `${project.code} · ` : ''}
            {project.isManager ? t('dashboard.projects.rolePm') : t('dashboard.projects.roleMember')}
          </p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-0.5">
        <Link
          to={`/projects/${project.id}?tab=documents`}
          className="rounded-[var(--radius-badge)] px-1.5 py-0.5 text-xs font-semibold text-primary hover:bg-primary-ghost"
        >
          {t('dashboard.projects.openDocuments')}
        </Link>
        <Link
          to={`/projects/${project.id}?tab=issues`}
          className="rounded-[var(--radius-badge)] px-1.5 py-0.5 text-xs font-semibold text-text-muted hover:bg-content-bg"
        >
          {t('dashboard.projects.openIssues')}
        </Link>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const {
    currentUser,
    greetingKey,
    todayStr,
    overdueIssues,
    unreadNotifications,
    deadlines,
    workItems,
    workItemsLoading,
    workItemsError,
    myProjects,
    projectsLoading,
    projectsError,
  } = useDashboard();

  const displayName = currentUser?.userName?.split(' ').pop() || t('dashboard.defaultName');

  const todayKey = toDateKey(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState(todayKey);
  const weekStart = startOfWeek(fromDateKey(selectedDayKey) ?? new Date());

  const deadlineCountByDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of deadlines) {
      if (!item.dueDateKey) continue;
      counts.set(item.dueDateKey, (counts.get(item.dueDateKey) ?? 0) + 1);
    }
    return counts;
  }, [deadlines]);

  const selectedDayDeadlines = useMemo(
    () => deadlines.filter((item) => item.dueDateKey === selectedDayKey),
    [deadlines, selectedDayKey],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="heading-page">{t('admin.nav.overview')}</h1>
        <span className="text-sm text-text-muted">
          {`${t(greetingKey)}, ${displayName} · ${todayStr}`}
        </span>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-5 sm:grid-cols-3">
        <StatTile
          label={t('dashboard.stats.projects')}
          value={myProjects.length}
          tone="primary"
          to="/projects"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <StatTile
          label={t('dashboard.stats.pending')}
          value={workItems.length + deadlines.length}
          tone="warning"
          badge={overdueIssues > 0 ? `${overdueIssues} ${t('dashboard.stats.overdueSuffix')}` : undefined}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatTile
          label={t('dashboard.stats.unread')}
          value={unreadNotifications}
          tone="danger"
          to="/notifications"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-3 lg:grid-rows-[1.8fr_1fr]">
        <BentoCard
          title={t('dashboard.urgent.title')}
          tone="danger"
          count={workItems.length}
          className="min-h-[240px] lg:col-span-2"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
            </svg>
          }
        >
          <div className="admin-scrollbar min-h-0 flex-1 space-y-2 overflow-auto p-3">
            {workItemsLoading && <EmptyState message={t('common.loading')} />}
            {!workItemsLoading && workItemsError && (
              <EmptyState message={workItemsError} tone="danger" />
            )}
            {!workItemsLoading && !workItemsError && workItems.length === 0 && (
              <EmptyState message={t('dashboard.urgent.empty')} />
            )}
            {workItems.map((item) => (
              <WorkItemRow key={item.id} item={item} />
            ))}
          </div>
        </BentoCard>

        <BentoCard
          title={t('dashboard.schedule.title')}
          tone="warning"
          count={deadlines.length}
          className="min-h-[220px] lg:row-span-2"
          action={<CardLink to="/issues?assignee=me" label={t('dashboard.viewAll')} />}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        >
          <WeekCalendar
            weekStart={weekStart}
            selectedKey={selectedDayKey}
            todayKey={todayKey}
            countByDay={deadlineCountByDay}
            onSelect={setSelectedDayKey}
            onShiftWeek={(delta) =>
              setSelectedDayKey(toDateKey(addDays(fromDateKey(selectedDayKey) ?? new Date(), delta * 7)))
            }
          />
          <div className="admin-scrollbar min-h-0 flex-1 space-y-2 overflow-auto p-3">
            {workItemsLoading && <EmptyState message={t('common.loading')} />}
            {!workItemsLoading && workItemsError && (
              <EmptyState message={workItemsError} tone="danger" />
            )}
            {!workItemsLoading && !workItemsError && deadlines.length === 0 && (
              <EmptyState message={t('dashboard.schedule.empty')} />
            )}
            {!workItemsLoading && !workItemsError && deadlines.length > 0 && selectedDayDeadlines.length === 0 && (
              <EmptyState message={t('dashboard.schedule.emptyDay')} />
            )}
            {selectedDayDeadlines.map((item) => (
              <DeadlineRow key={item.id} item={item} />
            ))}
          </div>
        </BentoCard>
        <BentoCard
          title={t('dashboard.projects.title')}
          tone="primary"
          count={myProjects.length}
          className="min-h-[180px] lg:col-span-2"
          action={<CardLink to="/projects" label={t('dashboard.viewAll')} />}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M5 21V7l8-4v18" />
              <path d="M19 21V11l-6-4" />
            </svg>
          }
        >
          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto p-5">
            {projectsLoading && <EmptyState message={t('common.loading')} />}
            {!projectsLoading && projectsError && (
              <EmptyState message={projectsError} tone="danger" />
            )}
            {!projectsLoading && !projectsError && myProjects.length === 0 && (
              <EmptyState message={t('dashboard.projects.empty')} />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {myProjects.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </div>
          </div>
        </BentoCard>

      </div>
    </div>
  );
}
