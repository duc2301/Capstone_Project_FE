import type { AuditLogItem } from '@/entities/audit-log';
import { AuditAction, LogScope } from '@/entities/audit-log';
import { t } from '@/shared/lib/i18n';
import type { TranslationKey } from '@/shared/lib/i18n';

/* Màu CHỈ dùng cho chip hành động — phần nội dung luôn giữ màu chữ trung tính.
 * Trước đây cả chip lẫn nội dung cùng tô một màu nên nhìn vào chỉ thấy "cả dòng đỏ",
 * không tách được đâu là hành động, đâu là dữ liệu. Thêm viền để 4 mức phân biệt được
 * cả khi in đen trắng hoặc với người khó phân biệt màu. */
const SEVERITY_CLASS = {
  critical: 'bg-danger-light text-danger ring-1 ring-inset ring-danger/25',
  lifecycle: 'bg-warning-light text-warning ring-1 ring-inset ring-warning/30',
  routine: 'bg-info-light text-info ring-1 ring-inset ring-info/25',
  readonly: 'bg-content-bg text-text-muted ring-1 ring-inset ring-card-border',
} as const;

/* Vạch màu đầu dòng: giữ khả năng quét nhanh các thao tác nhạy cảm mà không phải
 * tô màu chữ nội dung. */
const ROW_ACCENT_CLASS = {
  critical: 'border-l-2 border-l-danger',
  lifecycle: 'border-l-2 border-l-warning',
  routine: 'border-l-2 border-l-transparent',
  readonly: 'border-l-2 border-l-transparent',
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
  [AuditAction.View]: { key: 'audit.action.view', severity: 'readonly' },
  [AuditAction.Share]: { key: 'audit.action.share', severity: 'critical' },
  [AuditAction.RevokeShare]: { key: 'audit.action.revokeShare', severity: 'critical' },
};

export function actionBadge(action: number) {
  const meta = ACTION_META[action];
  return meta
    ? { label: t(meta.key), className: SEVERITY_CLASS[meta.severity] }
    : { label: String(action), className: SEVERITY_CLASS.readonly };
}

export function rowAccentClass(action: number): string {
  const severity = ACTION_META[action]?.severity ?? 'readonly';
  return ROW_ACCENT_CLASS[severity];
}

/* BE ghi log phân quyền dạng "Tiêu đề: A → mức; B → mức".
 * Tách tiêu đề và các mục để bảng xuống dòng từng mục, thay vì một câu dài khó dò.
 * Không khớp mẫu (log thường) thì trả nguyên câu — mọi log cũ vẫn hiển thị như trước. */
export function splitDetail(detail: string): { head: string; items: string[] } {
  const arrow = detail.indexOf(' → ');
  if (arrow < 0) return { head: detail, items: [] };

  // Lấy dấu ':' cuối cùng TRƯỚC mũi tên đầu tiên -> tên tệp/thư mục có chứa ':' vẫn tách đúng.
  const sep = detail.lastIndexOf(': ', arrow);
  if (sep < 0) return { head: detail, items: [] };

  const items = detail.slice(sep + 2).split('; ').map((s) => s.trim()).filter(Boolean);
  return items.length > 1 ? { head: detail.slice(0, sep), items } : { head: detail, items: [] };
}

const ENTITY_LABEL: Record<string, TranslationKey> = {
  fileitem: 'audit.entity.fileItem',
  folder: 'audit.entity.folder',
  approvalrequest: 'audit.entity.approvalRequest',
  zonereturnrequest: 'audit.entity.zoneReturnRequest',
  project: 'audit.entity.project',
  account: 'audit.entity.account',
  group: 'audit.entity.group',
  groupmember: 'audit.entity.groupMember',
  projectparticipant: 'audit.entity.projectParticipant',
  projectinvitation: 'audit.entity.projectInvitation',
  issue: 'audit.entity.issue',
  discussion: 'audit.entity.discussion',
  markupset: 'audit.entity.markupSet',
  namingconvention: 'audit.entity.namingConvention',
  contract: 'audit.entity.contract',
  contractpackage: 'audit.entity.contractPackage',
  organization: 'audit.entity.organization',
};

/* Tên loại đối tượng bằng tiếng Việt; entity lạ thì giữ nguyên chuỗi BE trả về. */
export function entityLabel(entityType: string | null): string {
  if (!entityType) return '';
  const key = ENTITY_LABEL[entityType.toLowerCase()];
  return key ? t(key) : entityType;
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
