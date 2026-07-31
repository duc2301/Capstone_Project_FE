import type { AuditLogItem } from '@/entities/audit-log';
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

/* "Phân hệ" (module) — mockup có cột này nhưng BE chưa lưu field module.
 * Suy ra từ hành động + loại đối tượng + phạm vi (ưu tiên cái rõ nghĩa nhất). */
function moduleKey(log: Pick<AuditLogItem, 'scope' | 'action' | 'entityType'>): TranslationKey {
  const et = (log.entityType ?? '').toLowerCase();

  // 1) Theo hành động rõ nghĩa
  if (log.action === AuditAction.PermissionChange) return 'audit.module.permission';
  if (
    log.action === AuditAction.Invite
    || log.action === AuditAction.AcceptInvite
    || log.action === AuditAction.RejectInvite
    || log.action === AuditAction.Assign
  ) return 'audit.module.group';

  // 2) Theo loại đối tượng
  if (/permission|role|grant/.test(et)) return 'audit.module.permission';
  if (/account|auth|login|session|token|credential/.test(et)) return 'audit.module.auth';
  if (/file|folder|document|version|markup|issue/.test(et)) return 'audit.module.document';
  if (/group|team|member|invitation|invite/.test(et)) return 'audit.module.group';
  if (/project|package|organization|contract/.test(et)) return 'audit.module.project';

  // 3) Theo phạm vi log
  if (log.scope === LogScope.System) return 'audit.module.system';
  if (log.scope === LogScope.Group) return 'audit.module.group';
  if (log.scope === LogScope.Project) return 'audit.module.project';
  return 'audit.module.other';
}

export function moduleLabel(log: Pick<AuditLogItem, 'scope' | 'action' | 'entityType'>): string {
  return t(moduleKey(log));
}

/* BE trả UTC (DateTime.UtcNow) không kèm hậu tố Z -> ép về UTC. */
function parseUtc(iso: string | null): Date | null {
  if (!iso) return null;
  const normalized = /(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* Ngày (đổi sang giờ máy) — vd "24 thg 10, 2023". */
export function formatLogDate(iso: string | null): string {
  const d = parseUtc(iso);
  if (!d) return '—';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* Giờ theo UTC + hậu tố "UTC" — vd "14:32:05 UTC" (khớp mockup). */
export function formatLogClock(iso: string | null): string {
  const d = parseUtc(iso);
  if (!d) return '—';
  const clock = d.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC',
  });
  return `${clock} UTC`;
}

/* Giữ lại cho nơi cần 1 dòng ngày+giờ gộp. */
export function formatLogTime(iso: string | null): string {
  const d = parseUtc(iso);
  if (!d) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
