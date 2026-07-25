import { AuditAction, LogScope } from '@/entities/audit-log';
import { t } from '@/shared/lib/i18n';
import type { TranslationKey } from '@/shared/lib/i18n';

/* Nhãn + màu badge cho từng hành động. Nhóm màu theo "tính chất" thao tác:
 *  xanh lá = tạo/chấp thuận, đỏ = xoá/từ chối, vàng = chuyển vùng/đổi quyền, xám = đọc. */
const ACTION_META: Record<number, { key: TranslationKey; className: string }> = {
  [AuditAction.Create]: { key: 'audit.action.create', className: 'bg-success-light text-success' },
  [AuditAction.Update]: { key: 'audit.action.update', className: 'bg-primary-ghost text-primary' },
  [AuditAction.Delete]: { key: 'audit.action.delete', className: 'bg-danger-light text-danger' },
  [AuditAction.Move]: { key: 'audit.action.move', className: 'bg-warning-light text-warning' },
  [AuditAction.Submit]: { key: 'audit.action.submit', className: 'bg-primary-ghost text-primary' },
  [AuditAction.Verify]: { key: 'audit.action.verify', className: 'bg-primary-ghost text-primary' },
  [AuditAction.Approve]: { key: 'audit.action.approve', className: 'bg-success-light text-success' },
  [AuditAction.Reject]: { key: 'audit.action.reject', className: 'bg-danger-light text-danger' },
  [AuditAction.Download]: { key: 'audit.action.download', className: 'bg-content-bg text-text-muted' },
  [AuditAction.PermissionChange]: { key: 'audit.action.permissionChange', className: 'bg-warning-light text-warning' },
  [AuditAction.Upload]: { key: 'audit.action.upload', className: 'bg-success-light text-success' },
  [AuditAction.NewVersion]: { key: 'audit.action.newVersion', className: 'bg-primary-ghost text-primary' },
  [AuditAction.Sign]: { key: 'audit.action.sign', className: 'bg-success-light text-success' },
  [AuditAction.ZoneTransfer]: { key: 'audit.action.zoneTransfer', className: 'bg-warning-light text-warning' },
  [AuditAction.ReturnRequest]: { key: 'audit.action.returnRequest', className: 'bg-warning-light text-warning' },
  [AuditAction.Invite]: { key: 'audit.action.invite', className: 'bg-primary-ghost text-primary' },
  [AuditAction.AcceptInvite]: { key: 'audit.action.acceptInvite', className: 'bg-success-light text-success' },
  [AuditAction.RejectInvite]: { key: 'audit.action.rejectInvite', className: 'bg-danger-light text-danger' },
  [AuditAction.Assign]: { key: 'audit.action.assign', className: 'bg-primary-ghost text-primary' },
  [AuditAction.StatusChange]: { key: 'audit.action.statusChange', className: 'bg-warning-light text-warning' },
};

export function actionBadge(action: number) {
  const meta = ACTION_META[action];
  return meta
    ? { label: t(meta.key), className: meta.className }
    : { label: String(action), className: 'bg-content-bg text-text-muted' };
}

const SCOPE_META: Record<number, { key: TranslationKey; className: string }> = {
  [LogScope.System]: { key: 'audit.scope.system', className: 'bg-danger-light text-danger' },
  [LogScope.Project]: { key: 'audit.scope.project', className: 'bg-primary-ghost text-primary' },
  [LogScope.Group]: { key: 'audit.scope.group', className: 'bg-content-bg text-text-secondary' },
};

export function scopeBadge(scope: number) {
  const meta = SCOPE_META[scope];
  return meta
    ? { label: t(meta.key), className: meta.className }
    : { label: String(scope), className: 'bg-content-bg text-text-muted' };
}

/* BE trả UTC (DateTime.UtcNow) không kèm hậu tố Z -> ép về UTC trước khi đổi sang giờ máy. */
export function formatLogTime(iso: string | null): string {
  if (!iso) return '—';
  const normalized = /(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
