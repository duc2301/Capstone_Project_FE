import type { ApprovalStatus } from '@/entities/approval';
import { t } from '@/shared/lib/i18n';

/* ISO date -> dd/MM/yyyy HH:mm */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/* Trạng thái phê duyệt -> nhãn + class màu badge (dùng chung màu với trạng thái file) */
export function approvalStatusBadge(status: ApprovalStatus): { label: string; className: string } {
  switch (status) {
    case 'Approved':
      return { label: t('documents.status.approved'), className: 'bg-success-light text-success' };
    case 'Rejected':
      return { label: t('documents.status.rejected'), className: 'bg-danger-light text-danger' };
    default:
      return { label: t('documents.status.pending'), className: 'bg-warning-light text-warning' };
  }
}
