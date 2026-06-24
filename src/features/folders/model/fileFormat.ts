import type { FileListItem } from '@/entities/file-item';
import { FileItemStatus, FileReturnRequestStatus } from '@/entities/file-item';
import { t } from '@/shared/lib/i18n';

/* Bytes -> chuỗi dễ đọc (KB/MB/GB) */
export function formatSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/* ISO date -> dd/MM/yyyy */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* Trạng thái file -> nhãn + class màu badge */
export function statusBadge(status: FileItemStatus): { label: string; className: string } {
  switch (status) {
    case FileItemStatus.Approved:
      return { label: t('documents.status.approved'), className: 'bg-success-light text-success' };
    case FileItemStatus.PendingApproval:
      return { label: t('documents.status.pending'), className: 'bg-warning-light text-warning' };
    case FileItemStatus.Rejected:
      return { label: t('documents.status.rejected'), className: 'bg-danger-light text-danger' };
    default:
      return { label: t('documents.status.draft'), className: 'bg-content-bg text-text-secondary' };
  }
}

/* Trạng thái hiển thị trên bảng file.
 * Return request là trạng thái phụ của luồng trả về WIP, không ghi đè trạng thái thật của FileItem.
 */
export function fileStatusBadge(file: FileListItem): { label: string; className: string } {
  if (file.status === FileItemStatus.PendingApproval) {
    return statusBadge(file.status);
  }

  if (file.returnRequestStatus === FileReturnRequestStatus.Pending) {
    return {
      label: t('documents.status.returnPending'),
      className: 'bg-warning-light text-warning',
    };
  }

  if (file.returnRequestStatus === FileReturnRequestStatus.Rejected) {
    return {
      label: t('documents.status.returnRejected'),
      className: 'bg-danger-light text-danger',
    };
  }

  return statusBadge(file.status);
}
