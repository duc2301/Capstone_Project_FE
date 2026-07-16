import type { IssuePriority, IssueStatus } from '@/entities/issue';
import { t } from '@/shared/lib/i18n';

export function issueStatusBadge(status: IssueStatus): { label: string; className: string } {
  switch (status) {
    case 'Closed':
      return { label: t('issues.status.closed'), className: 'bg-success-light text-success' };
    case 'Answered':
      return { label: t('issues.status.answered'), className: 'bg-primary/10 text-primary' };
    case 'InProgress':
      return { label: t('issues.status.inProgress'), className: 'bg-warning-light text-warning' };
    default:
      return { label: t('issues.status.open'), className: 'bg-danger-light text-danger' };
  }
}

export function issuePriorityBadge(priority: IssuePriority): { label: string; className: string } {
  switch (priority) {
    case 'Critical':
      return { label: t('issues.priority.critical'), className: 'bg-danger-light text-danger' };
    case 'High':
      return { label: t('issues.priority.high'), className: 'bg-warning-light text-warning' };
    case 'Medium':
      return { label: t('issues.priority.medium'), className: 'bg-primary/10 text-primary' };
    default:
      return { label: t('issues.priority.low'), className: 'bg-content-bg text-text-secondary' };
  }
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];

/* Nhan dien URL anh (bo qua query string cua presigned URL) de hien thumbnail thay vi link text */
export function isImageUrl(url: string): boolean {
  const path = url.split('?')[0].toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext));
}

/* ISO date -> dd/MM/yyyy HH:mm (giong formatDateTime cua approvalFormat.ts) */
export function formatIssueDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
