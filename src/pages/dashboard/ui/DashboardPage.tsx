import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { formatLogTime, MyActivityFeed } from '@/features/audit-logs';
import { useDashboard } from '@/features/dashboard';
import type { MyProjectItem, RecentFileItem, WorkItem, WorkItemKind } from '@/features/dashboard';
import { t } from '@/shared/lib/i18n';
import type { TranslationKey } from '@/shared/lib/i18n';

type Tone = 'warning' | 'danger' | 'primary' | 'info' | 'neutral';

const TONE_SOFT: Record<Tone, string> = {
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
  primary: 'bg-primary-ghost text-primary',
  info: 'bg-info-light text-info',
  neutral: 'bg-content-bg text-text-secondary',
};

const TONE_RAIL: Record<Tone, string> = {
  warning: 'bg-warning',
  danger: 'bg-danger',
  primary: 'bg-primary',
  info: 'bg-info',
  neutral: 'bg-card-border',
};

const WORK_ITEM_META: Record<WorkItemKind, { labelKey: TranslationKey; tone: Tone }> = {
  approval: { labelKey: 'dashboard.queue.kind.approval', tone: 'warning' },
  signature: { labelKey: 'dashboard.queue.kind.signature', tone: 'danger' },
  submitted: { labelKey: 'dashboard.queue.kind.submitted', tone: 'neutral' },
  returnRequest: { labelKey: 'dashboard.queue.kind.returnRequest', tone: 'danger' },
  invitation: { labelKey: 'dashboard.queue.kind.invitation', tone: 'primary' },
  issue: { labelKey: 'dashboard.queue.kind.issue', tone: 'info' },
};

function waitingLabel(days: number): string {
  if (days <= 0) return t('dashboard.queue.today');
  return `${t('dashboard.queue.waitingPrefix')} ${days} ${t('dashboard.queue.daysSuffix')}`;
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SectionCard({
  title,
  action,
  count,
  badge,
  children,
  className = '',
}: {
  title: string;
  action?: ReactNode;
  count?: number;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-card-border bg-card shadow-card ${className}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-card-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          <h2 className="heading-entity">{title}</h2>
          {count !== undefined && count > 0 && (
            <span className="rounded-[var(--radius-badge)] bg-content-bg px-2 py-0.5 text-xs font-bold text-text-secondary">
              {count}
            </span>
          )}
          {badge}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message, tone = 'muted' }: { message: string; tone?: 'muted' | 'danger' }) {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-8 text-center">
      <p className={tone === 'danger' ? 'modal-text text-danger' : 'modal-text'}>{message}</p>
    </div>
  );
}

function WorkItemRow({ item }: { item: WorkItem }) {
  const meta = WORK_ITEM_META[item.kind];
  const content = (
    <div className="flex items-stretch gap-3 px-5 py-3 transition-colors hover:bg-content-bg">
      <span className={`w-1 shrink-0 rounded-full ${TONE_RAIL[meta.tone]}`} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className={`rounded-[var(--radius-badge)] px-2 py-0.5 text-xs font-semibold ${TONE_SOFT[meta.tone]}`}>
            {t(meta.labelKey)}
          </span>
          {item.isOverdue && (
            <span className="rounded-[var(--radius-badge)] bg-danger px-2 py-0.5 text-xs font-semibold text-white">
              {t('dashboard.queue.overdue')}
            </span>
          )}
          <span className="field-hint">{waitingLabel(item.waitingDays)}</span>
        </div>
        <p className="heading-label truncate">{item.title}</p>
        {item.context && <p className="field-hint truncate">{item.context}</p>}
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

function RecentFileRow({ file }: { file: RecentFileItem }) {
  return (
    <Link
      to={file.link}
      className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-content-bg"
    >
      <span className="shrink-0 text-text-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </span>
      <p className="min-w-0 flex-1 truncate text-sm text-text">{file.detail}</p>
      <span className="field-hint shrink-0">{formatLogTime(file.createdAt)}</span>
      <span className="shrink-0 text-text-muted">
        <ChevronIcon />
      </span>
    </Link>
  );
}

function ProjectRow({ project }: { project: MyProjectItem }) {
  return (
    <div className="flex items-center gap-2 px-5 py-2.5 transition-colors hover:bg-content-bg">
      <Link to={`/projects/${project.id}`} className="flex min-w-0 flex-1 items-center gap-2">
        {project.code && (
          <span className="shrink-0 rounded-[var(--radius-badge)] bg-content-bg px-2 py-0.5 text-xs font-bold tracking-[0.4px] text-text-secondary">
            {project.code}
          </span>
        )}
        <p className="heading-label min-w-0 flex-1 truncate">{project.name}</p>
        {project.isManager && (
          <span className="shrink-0 rounded-[var(--radius-badge)] bg-primary-ghost px-2 py-0.5 text-xs font-semibold text-primary">
            {t('dashboard.projects.rolePm')}
          </span>
        )}
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        <Link
          to={`/projects/${project.id}?tab=documents`}
          className="rounded-[var(--radius-badge)] px-2 py-0.5 text-xs font-semibold text-primary hover:bg-primary-ghost"
        >
          {t('dashboard.projects.openDocuments')}
        </Link>
        <Link
          to={`/projects/${project.id}?tab=issues`}
          className="rounded-[var(--radius-badge)] px-2 py-0.5 text-xs font-semibold text-text-muted hover:bg-content-bg"
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
    workItems,
    workItemsLoading,
    workItemsError,
    recentFiles,
    activityLogs,
    activityLoading,
    activityError,
    myProjects,
    projectsLoading,
    projectsError,
  } = useDashboard();

  const displayName = currentUser?.userName?.split(' ').pop() || t('dashboard.defaultName');

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="heading-page">{t('admin.nav.overview')}</h1>
        <span className="text-sm text-text-muted">
          {`${t(greetingKey)}, ${displayName} · ${todayStr}`}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex min-h-0 flex-col gap-5 lg:col-span-2">
          <SectionCard
            title={t('dashboard.urgent.title')}
            count={workItems.length}
            badge={
              overdueIssues > 0 ? (
                <span className="rounded-[var(--radius-badge)] bg-danger px-2 py-0.5 text-xs font-semibold text-white">
                  {`${overdueIssues} ${t('dashboard.stats.overdueSuffix')}`}
                </span>
              ) : undefined
            }
            className="min-h-[240px] flex-1"
          >
            <div className="min-h-0 flex-1 overflow-auto">
              {workItemsLoading && <EmptyState message={t('common.loading')} />}
              {!workItemsLoading && workItemsError && (
                <EmptyState message={workItemsError} tone="danger" />
              )}
              {!workItemsLoading && !workItemsError && workItems.length === 0 && (
                <EmptyState message={t('dashboard.urgent.empty')} />
              )}
              {workItems.length > 0 && (
                <div className="divide-y divide-card-border">
                  {workItems.map((item) => (
                    <WorkItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title={t('dashboard.recentFiles.title')} className="max-h-[42%] shrink-0">
            <div className="min-h-0 flex-1 overflow-auto py-1.5">
              {activityLoading && <EmptyState message={t('common.loading')} />}
              {!activityLoading && activityError && (
                <EmptyState message={activityError} tone="danger" />
              )}
              {!activityLoading && !activityError && recentFiles.length === 0 && (
                <EmptyState message={t('dashboard.recentFiles.empty')} />
              )}
              {recentFiles.map((file) => (
                <RecentFileRow key={file.id} file={file} />
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="flex min-h-0 flex-col gap-5">
          <SectionCard
            title={t('dashboard.projects.title')}
            count={myProjects.length}
            action={
              <Link to="/projects" className="text-sm font-semibold text-primary hover:underline">
                {t('dashboard.projects.viewAll')}
              </Link>
            }
            className="max-h-[45%] shrink-0"
          >
            <div className="min-h-0 flex-1 overflow-auto py-1.5">
              {projectsLoading && <EmptyState message={t('common.loading')} />}
              {!projectsLoading && projectsError && (
                <EmptyState message={projectsError} tone="danger" />
              )}
              {!projectsLoading && !projectsError && myProjects.length === 0 && (
                <EmptyState message={t('dashboard.projects.empty')} />
              )}
              {myProjects.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title={t('dashboard.activity.myTab')} className="min-h-[200px] flex-1">
            <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
              <MyActivityFeed logs={activityLogs} loading={activityLoading} error={activityError} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
