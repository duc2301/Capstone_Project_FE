import type { AuditLogItem } from '@/entities/audit-log';
import { AuditAction, LogScope } from '@/entities/audit-log';
import { t } from '@/shared/lib/i18n';
import type { TranslationKey } from '@/shared/lib/i18n';

const SEVERITY_CLASS = {
  critical: 'bg-danger-light text-danger',
  lifecycle: 'bg-warning-light text-warning',
  routine: 'bg-info-light text-info',
  readonly: 'bg-content-bg text-text-muted',
} as const;

type ActionSeverity = keyof typeof SEVERITY_CLASS;

const ACTION_META: Record<number, { key: TranslationKey; severity: ActionSeverity }> = {
  [AuditAction.Create]: { key: 'audit.action.create', severity: 'routine' },
  [AuditAction.Update]: { key: 'audit.action.update', severity: 'routine' },
  [AuditAction.Delete]: { key: 'audit.action.delete', severity: 'critical' },
  [AuditAction.Move]: { key: 'audit.action.move', severity: 'lifecycle' },
  [AuditAction.Submit]: { key: 'audit.action.submit', severity: 'lifecycle' },
  [AuditAction.Verify]: { key: 'audit.action.verify', severity: 'lifecycle' },
  [AuditAction.Approve]: { key: 'audit.action.approve', severity: 'lifecycle' },
  [AuditAction.Reject]: { key: 'audit.action.reject', severity: 'critical' },
  [AuditAction.Download]: { key: 'audit.action.download', severity: 'readonly' },
  [AuditAction.PermissionChange]: { key: 'audit.action.permissionChange', severity: 'critical' },
  [AuditAction.Upload]: { key: 'audit.action.upload', severity: 'routine' },
  [AuditAction.NewVersion]: { key: 'audit.action.newVersion', severity: 'routine' },
  [AuditAction.Sign]: { key: 'audit.action.sign', severity: 'critical' },
  [AuditAction.ZoneTransfer]: { key: 'audit.action.zoneTransfer', severity: 'lifecycle' },
  [AuditAction.ReturnRequest]: { key: 'audit.action.returnRequest', severity: 'lifecycle' },
  [AuditAction.Invite]: { key: 'audit.action.invite', severity: 'routine' },
  [AuditAction.AcceptInvite]: { key: 'audit.action.acceptInvite', severity: 'routine' },
  [AuditAction.RejectInvite]: { key: 'audit.action.rejectInvite', severity: 'critical' },
  [AuditAction.Assign]: { key: 'audit.action.assign', severity: 'routine' },
  [AuditAction.StatusChange]: { key: 'audit.action.statusChange', severity: 'lifecycle' },
  [AuditAction.Archive]: { key: 'audit.action.archive', severity: 'lifecycle' },
  [AuditAction.Login]: { key: 'audit.action.login', severity: 'readonly' },
  [AuditAction.Logout]: { key: 'audit.action.logout', severity: 'readonly' },
  [AuditAction.LoginFailed]: { key: 'audit.action.loginFailed', severity: 'critical' },
};

export function actionBadge(action: number) {
  const meta = ACTION_META[action];
  return meta
    ? { label: t(meta.key), className: SEVERITY_CLASS[meta.severity] }
    : { label: String(action), className: SEVERITY_CLASS.readonly };
}

export function detailTone(action: number): 'danger' | 'warning' | 'normal' {
  const severity = ACTION_META[action]?.severity;
  if (severity === 'critical') return 'danger';
  if (severity === 'lifecycle') return 'warning';
  return 'normal';
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
const MODULE_BY_ENTITY: Record<string, TranslationKey> = {
  account: 'audit.module.auth',
  fileitem: 'audit.module.document',
  folder: 'audit.module.document',
  approvalrequest: 'audit.module.document',
  zonereturnrequest: 'audit.module.document',
  markupset: 'audit.module.document',
  namingconvention: 'audit.module.document',
  issue: 'audit.module.document',
  discussion: 'audit.module.document',
  group: 'audit.module.group',
  groupmember: 'audit.module.group',
  projectinvitation: 'audit.module.group',
  projectparticipant: 'audit.module.group',
  project: 'audit.module.project',
  contract: 'audit.module.project',
  contractpackage: 'audit.module.project',
  organization: 'audit.module.project',
};

function moduleKey(log: Pick<AuditLogItem, 'scope' | 'action' | 'entityType'>): TranslationKey {
  if (log.action === AuditAction.PermissionChange) return 'audit.module.permission';

  const byEntity = MODULE_BY_ENTITY[(log.entityType ?? '').toLowerCase()];
  if (byEntity) return byEntity;

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

export function formatLogClock(iso: string | null): string {
  const d = parseUtc(iso);
  if (!d) return '—';
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/* Giữ lại cho nơi cần 1 dòng ngày+giờ gộp. */
export function formatLogTime(iso: string | null): string {
  const d = parseUtc(iso);
  if (!d) return '—';
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
