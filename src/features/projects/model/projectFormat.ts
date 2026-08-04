import type { Project, ProjectStatus } from '@/entities/project';
import { ProjectStatus as Status } from '@/entities/project';
import { t } from '@/shared/lib/i18n';
import type { TranslationKey } from '@/shared/lib/i18n';

export const PROJECT_FILTERS = ['all', 'active', 'completed'] as const;
export type ProjectFilter = (typeof PROJECT_FILTERS)[number];

const FILTER_LABEL: Record<ProjectFilter, TranslationKey> = {
  all: 'projects.filter.all',
  active: 'projects.filter.active',
  completed: 'projects.filter.completed',
};

const STATUS_META: Record<ProjectStatus, { key: TranslationKey; badgeClass: string; dotClass: string }> = {
  [Status.Active]: {
    key: 'projects.status.active',
    badgeClass: 'bg-primary text-white',
    dotClass: 'bg-warning',
  },
  [Status.Completed]: {
    key: 'projects.status.completed',
    badgeClass: 'bg-[#8A5100] text-white',
    dotClass: 'bg-white/80',
  },
};

export function filterLabel(filter: ProjectFilter): string {
  return t(FILTER_LABEL[filter]);
}

export function statusMeta(status: ProjectStatus) {
  const meta = STATUS_META[status] ?? STATUS_META[Status.Active];
  return { label: t(meta.key), badgeClass: meta.badgeClass, dotClass: meta.dotClass };
}

export function matchesFilter(project: Project, filter: ProjectFilter): boolean {
  if (filter === 'all') return true;
  return filter === 'completed'
    ? project.status === Status.Completed
    : project.status === Status.Active;
}

export function projectAddress(project: Project): string | null {
  return project.location?.address?.trim() || project.contactAddress?.trim() || null;
}
