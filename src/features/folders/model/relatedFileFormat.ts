import { RelatedFileArea } from '@/entities/file-item';

const AREA_LABELS: Record<RelatedFileArea, string> = {
  [RelatedFileArea.Wip]: 'WIP',
  [RelatedFileArea.Shared]: 'Shared',
  [RelatedFileArea.Published]: 'Published',
  [RelatedFileArea.Archived]: 'Archived',
};

const AREA_BADGE_CLASSES: Record<RelatedFileArea, string> = {
  [RelatedFileArea.Wip]: 'bg-content-bg text-text-secondary',
  [RelatedFileArea.Shared]: 'bg-primary/10 text-primary',
  [RelatedFileArea.Published]: 'bg-success-light text-success',
  [RelatedFileArea.Archived]: 'bg-warning-light text-warning',
};

export function relatedFileAreaBadge(area: RelatedFileArea): { label: string; className: string } {
  return {
    label: AREA_LABELS[area] ?? '—',
    className: AREA_BADGE_CLASSES[area] ?? 'bg-content-bg text-text-secondary',
  };
}
