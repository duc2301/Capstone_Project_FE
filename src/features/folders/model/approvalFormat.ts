import type { ApprovalListItem, ApprovalSigner, ApprovalStatus } from '@/entities/approval';
import type { Group } from '@/entities/group';
import { GroupMemberStatus } from '@/entities/group';
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

/* Chỉ đúng người/nhóm được chỉ định (signerAccountId khớp, hoặc thành viên active của signerGroupId)
 * mới được thấy nút ký số — asign người nào thì chỉ người đó ký, kể cả Leader khác cũng không được. */
export function isRequiredSigner(
  signers: ApprovalSigner[],
  accountId: string | undefined,
  groups: Group[],
): boolean {
  if (!accountId) return false;
  return signers.some((s) => {
    if (s.signerAccountId === accountId) return true;
    if (s.signerGroupId) {
      const group = groups.find((g) => g.id === s.signerGroupId);
      return group?.members.some((m) => m.accountId === accountId && m.status === GroupMemberStatus.Active) ?? false;
    }
    return false;
  });
}

/* "Người nhận" của 1 yêu cầu phê duyệt — ai đang cần xử lý tiếp theo:
 * - Còn Pending + cần ký chưa xong -> tên người/nhóm được asign ký (signers).
 * - Còn Pending + không cần ký (hoặc đã ký xong) -> tên Team Leader phụ trách (pendingApproverNames).
 * - Đã Approved/Rejected -> tên người đã quyết định (approvedByName), không còn ai "đang chờ" nữa. */
export function recipientNames(item: ApprovalListItem): string {
  if (item.status !== 'PendingApproval') {
    return item.approvedByName ?? '—';
  }

  if (item.requiresSignature && !item.isSigned) {
    const names = item.signers
      .map((s) => s.signerAccountName ?? s.signerGroupName)
      .filter((name): name is string => Boolean(name));
    if (names.length > 0) return names.join(', ');
  }

  const leaderNames = item.pendingApproverNames ?? [];
  return leaderNames.length > 0 ? leaderNames.join(', ') : '—';
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
