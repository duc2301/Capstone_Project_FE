import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ApprovalListItem } from '@/entities/approval';
import { approvalApi, approvalErrorMessage } from '@/entities/approval';
import type { Group } from '@/entities/group';
import type { ZoneReturnRequestItem } from '@/entities/zone-transfer';
import { zoneTransferApi, zoneTransferErrorMessage } from '@/entities/zone-transfer';
import type { ListTableColumn } from '@/shared/components';
import { ActionPillButton, ConfirmDialog, ListTable, PaginationBar, RowActions, Toast, useToast } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { approvalStatusBadge, formatDateTime, isRequiredSigner, recipientNames } from '../model/approvalFormat';
import { usePendingApprovals } from '../model/usePendingApprovals';
import { useZoneReturnRequests } from '../model/useZoneReturnRequests';
import { zoneLabel } from '../model/zoneTransferFormat';
import { ApprovalDetailModal } from './ApprovalDetailModal';
import { RejectApprovalModal } from './RejectApprovalModal';
import { RejectReturnModal } from './RejectReturnModal';

const approvalApproveLabel = (targetZone?: string | null) =>
  targetZone
    ? t('approvals.action.approveTo').replace('{zone}', targetZone)
    : t('approvals.action.approve');

const RETURN_REQUEST_COLUMNS: ListTableColumn[] = [
  { key: 'file', label: t('returnRequests.page.colFile'), width: 'w-[24%]' },
  { key: 'zone', label: t('returnRequests.page.colZone'), width: 'w-[110px]' },
  { key: 'requestedBy', label: t('returnRequests.page.colRequestedBy'), width: 'w-[140px]' },
  { key: 'reason', label: t('returnRequests.page.colReason') },
  { key: 'date', label: t('returnRequests.page.colDate'), width: 'w-[140px]' },
  { key: 'actions', label: t('common.col.actions'), width: 'w-[180px]', align: 'right' },
];

const APPROVAL_COLUMNS: ListTableColumn[] = [
  { key: 'name', label: t('approvals.pending.colName') },
  { key: 'sender', label: t('approvals.pending.colSender'), width: 'w-[140px]' },
  { key: 'recipient', label: t('approvals.pending.colRecipient'), width: 'w-[140px]' },
  { key: 'date', label: t('approvals.pending.colDate'), width: 'w-[140px]' },
  { key: 'status', label: t('approvals.pending.colStatus'), width: 'w-[120px]' },
  { key: 'signature', label: t('approvals.pending.colSignature'), width: 'w-[120px]' },
  { key: 'actions', label: t('common.col.actions'), width: 'w-[330px]', align: 'right' },
];

interface PendingApprovalsModalProps {
  onClose: () => void;
  /* Gọi sau khi phê duyệt/từ chối thành công để bên ngoài làm mới danh sách tệp đang xem. */
  onChanged?: () => void;
  /* Là Leader (hoặc Admin) của ÍT NHẤT 1 nhóm trong dự án. Dùng cho 2 việc: (1) quyết định có nên
   * coi lỗi 403 từ "/return-requests/pending" (endpoint chỉ dành cho Leader) là lỗi thật hay không;
   * (2) dự phòng cho nút Duyệt/Từ chối khi item do CHÍNH người dùng gửi (lúc đó không suy ra được
   * "là Leader đúng nhóm" từ việc item có hiển thị hay không — xem ghi chú tại isTeamLeaderForItem). */
  isLeader?: boolean;
  currentAccountId?: string;
  /* Dự phòng cho nút "Xem trực tiếp" khi BE không trả projectId trong chi tiết phê duyệt. */
  projectId?: string;
  /* Dùng để xác định đúng người/nhóm được chỉ định ký (asign) cho nút "Ký số". */
  projectGroups?: Group[];
}

export function PendingApprovalsModal({
  onClose,
  onChanged,
  isLeader = false,
  currentAccountId,
  projectId,
  projectGroups = [],
}: PendingApprovalsModalProps) {
  const navigate = useNavigate();
  const { items: allItems, loading, error, refetch } = usePendingApprovals();
  const {
    items: allReturnRequests,
    loading: returnLoading,
    error: returnError,
    refetch: refetchReturnRequests,
  } = useZoneReturnRequests();

  const items = allItems;
  /* Duyệt/Từ chối được: phải nằm trong pendingApproverAccountIds (Team Leader ACTIVE của đúng nhóm
   * phụ trách file, do BE tính qua ResolveFileItemTeamGroupIdsAsync) — kể cả khi item do chính
   * mình gửi, KHÔNG dùng isLeader (là Leader của bất kỳ nhóm nào trong dự án) để suy đoán nữa vì
   * sẽ cho phép Leader nhóm khác thao tác nhầm lên item không thuộc nhóm mình.
   * Khi item đã asign người ký (requiresSignature) mà chưa ký xong, việc ký đủ sẽ TỰ ĐỘNG hoàn tất
   * approve (xem ApprovalService.ApproveAsync viaSignatureCompletion) — Team Leader không cần bấm
   * gì cả trong lúc chờ ký, nên không tính là người cần hành động ở giai đoạn này. */
  const canActOnItem = (it: ApprovalListItem) =>
    !(it.requiresSignature && !it.isSigned)
    && Boolean(currentAccountId && it.pendingApproverAccountIds?.includes(currentAccountId));
  /* "Quản lý phê duyệt" còn phải hiện cả item mà mình chỉ được asign KÝ (không phải Leader/đúng
   * nhóm) — BE giờ đã trả về các item này (CanViewRequestAsync có thêm nhánh IsRequiredSignerAsync)
   * để người được asign ký vẫn thấy mà bấm "Ký số"; họ cũng được "Từ chối" thẳng nếu không đồng ý
   * ký (canRejectItem trong ApprovalItemsTable), chỉ riêng "Duyệt" vẫn dành riêng cho Team Leader. */
  const needsMyApprovalItems = items.filter(
    (it) => canActOnItem(it) || isRequiredSigner(it.signers, currentAccountId, projectGroups),
  );
  const myOwnItems = items.filter((it) => it.requestedByAccountId === currentAccountId);

  const returnRequests = allReturnRequests;
  const [needsApprovalPage, setNeedsApprovalPage] = useState(1);
  const [myRequestsPage, setMyRequestsPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<ApprovalListItem | null>(null);
  const [rejectFor, setRejectFor] = useState<ApprovalListItem | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [confirmReturnApprove, setConfirmReturnApprove] = useState<ZoneReturnRequestItem | null>(null);
  const [rejectReturnFor, setRejectReturnFor] = useState<ZoneReturnRequestItem | null>(null);
  const [returnBusyId, setReturnBusyId] = useState<string | null>(null);
  const approveReturnLabel = t('approvals.returnToWip.approve');
  const rejectReturnLabel = t('approvals.returnToWip.reject');

  const { toast, showToast } = useToast();

  /* Bấm "Ký số" ngoài danh sách -> đóng modal, điều hướng thẳng vào file, mở sẵn tab "Lịch sử ký số". */
  const handleSignNow = (it: ApprovalListItem) => {
    const viewProjectId = it.projectId ?? projectId;
    if (!viewProjectId) return;
    onClose();
    navigate(`/projects/${viewProjectId}/files/${it.fileItemId}/view?folder=${it.folderId ?? ''}&panel=signatureHistory`);
  };

  const handleApprove = async () => {
    if (!confirmApprove) return;
    setActionBusyId(confirmApprove.id);
    try {
      await approvalApi.approveApproval(confirmApprove.id);
      showToast(t('approvals.toast.approved'));
      setConfirmApprove(null);
      await refetch();
      onChanged?.();
    } catch (err) {
      showToast(approvalErrorMessage(err, t('common.error')), 'error');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectFor) return;
    setActionBusyId(rejectFor.id);
    try {
      await approvalApi.rejectApproval(rejectFor.id, reason);
      showToast(t('approvals.toast.rejected'));
      setRejectFor(null);
      await refetch();
      onChanged?.();
    } catch (err) {
      showToast(approvalErrorMessage(err, t('common.error')), 'error');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleApproveReturn = async () => {
    if (!confirmReturnApprove) return;
    setReturnBusyId(confirmReturnApprove.id);
    try {
      await zoneTransferApi.approveReturnRequest(confirmReturnApprove.id);
      showToast(t('returnRequests.toast.approved'));
      setConfirmReturnApprove(null);
      await refetchReturnRequests();
      onChanged?.();
    } catch (err) {
      showToast(zoneTransferErrorMessage(err, t('common.error')), 'error');
    } finally {
      setReturnBusyId(null);
    }
  };

  const handleRejectReturn = async (rejectReason: string) => {
    if (!rejectReturnFor) return;
    setReturnBusyId(rejectReturnFor.id);
    try {
      await zoneTransferApi.rejectReturnRequest(rejectReturnFor.id, rejectReason);
      showToast(t('returnRequests.toast.rejected'));
      setRejectReturnFor(null);
      await refetchReturnRequests();
      onChanged?.();
    } catch (err) {
      showToast(zoneTransferErrorMessage(err, t('common.error')), 'error');
    } finally {
      setReturnBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-6xl flex-col animate-scale-in rounded-[var(--radius-card-lg)] bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="heading-entity">{t('approvals.pending.title')}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {loading || returnLoading ? (
            <p className="py-12 text-center text-sm text-text-muted">{t('common.loading')}</p>
          ) : error || (isLeader && returnError) ? (
            /* returnError khi KHÔNG phải leader ở đâu cả là 403 bình thường (BE chỉ cho Leader xem
             * mục "chờ về WIP") — không phải lỗi thật, không chặn hiển thị phần "chờ duyệt" của member. */
            <p className="py-12 text-center text-sm text-danger">{error ?? returnError}</p>
          ) : items.length === 0 && returnRequests.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-muted">{t('approvals.pending.empty')}</p>
          ) : (
            <div className="space-y-8">
              {needsMyApprovalItems.length > 0 && (
                <ApprovalItemsTable
                  title={t('approvals.pending.needsApproval')}
                  items={needsMyApprovalItems}
                  page={needsApprovalPage}
                  onPageChange={setNeedsApprovalPage}
                  currentAccountId={currentAccountId}
                  projectGroups={projectGroups}
                  actionBusyId={actionBusyId}
                  onDetail={setDetailId}
                  onSignNow={handleSignNow}
                  onApprove={setConfirmApprove}
                  onReject={setRejectFor}
                />
              )}

              {myOwnItems.length > 0 && (
                <ApprovalItemsTable
                  title={t('approvals.pending.myRequests')}
                  items={myOwnItems}
                  page={myRequestsPage}
                  onPageChange={setMyRequestsPage}
                  currentAccountId={currentAccountId}
                  projectGroups={projectGroups}
                  actionBusyId={actionBusyId}
                  onDetail={setDetailId}
                  onSignNow={handleSignNow}
                  onApprove={setConfirmApprove}
                  onReject={setRejectFor}
                  hideDecisionActions
                />
              )}

              {returnRequests.length > 0 && (
                <section className="space-y-3">
                  <h3 className="heading-label">{t('returnRequests.page.title')}</h3>
                  <div className="overflow-x-auto">
                    <ListTable
                      columns={RETURN_REQUEST_COLUMNS}
                      minWidth="min-w-[900px]"
                      dense
                      stickyHead={false}
                      filledHead={false}
                    >
                      <tbody>
                        {returnRequests.map((request) => {
                          const busy = returnBusyId === request.id;
                          return (
                            <tr key={request.id} className="border-b border-card-border/60">
                              <td className="cell-wrap py-3 pr-3 align-top font-medium text-text">{request.fileName}</td>
                              <td className="cell-wrap px-3 py-3 align-top text-text-secondary">{zoneLabel(request.currentZone)}</td>
                              <td className="cell-wrap px-3 py-3 align-top text-text-secondary">{request.requestedByName}</td>
                              <td className="cell-wrap px-3 py-3 align-top text-text-secondary">{request.reason}</td>
                              <td className="px-3 py-3 align-top text-text-secondary">{formatDateTime(request.createdAt)}</td>
                              {/* /return-requests/pending chỉ trả về khi actor đúng là Leader của nhóm
                                  phụ trách file này (403 nếu không phải leader ở đâu cả) — có mặt trong
                                  danh sách nghĩa là chắc chắn được thao tác, không cần kiểm tra thêm. */}
                              <td className="whitespace-nowrap px-3 py-3 text-right">
                                <RowActions columns={2}>
                                  <ActionPillButton
                                    tone="success"
                                    disabled={busy}
                                    onClick={() => setConfirmReturnApprove(request)}
                                  >
                                    {approveReturnLabel}
                                  </ActionPillButton>
                                  <ActionPillButton
                                    tone="danger"
                                    disabled={busy}
                                    onClick={() => setRejectReturnFor(request)}
                                  >
                                    {rejectReturnLabel}
                                  </ActionPillButton>
                                </RowActions>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </ListTable>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      <Toast toast={toast} className="z-[70]" />

      {detailId && (
        <ApprovalDetailModal
          approvalId={detailId}
          onClose={() => setDetailId(null)}
          fallbackProjectId={projectId}
          currentAccountId={currentAccountId}
          projectGroups={projectGroups}
        />
      )}

      {confirmApprove && (
        <ConfirmDialog
          title={t('approvals.confirmApprove.title')}
          confirmLabel={t('approvals.confirmApprove.confirm')}
          cancelLabel={t('approvals.confirmApprove.cancel')}
          tone="primary"
          busy={!!actionBusyId}
          onConfirm={handleApprove}
          onCancel={() => setConfirmApprove(null)}
        />
      )}

      {rejectFor && (
        <RejectApprovalModal
          fileName={rejectFor.fileName}
          busy={actionBusyId === rejectFor.id}
          onClose={() => setRejectFor(null)}
          onSubmit={handleReject}
        />
      )}

      {confirmReturnApprove && (
        <ConfirmDialog
          title={t('returnRequests.confirmApprove.title')}
          confirmLabel={t('returnRequests.confirmApprove.confirm')}
          cancelLabel={t('returnRequests.confirmApprove.cancel')}
          tone="primary"
          busy={!!returnBusyId}
          onConfirm={handleApproveReturn}
          onCancel={() => setConfirmReturnApprove(null)}
        />
      )}

      {rejectReturnFor && (
        <RejectReturnModal
          fileName={rejectReturnFor.fileName}
          busy={returnBusyId === rejectReturnFor.id}
          onClose={() => setRejectReturnFor(null)}
          onSubmit={handleRejectReturn}
        />
      )}
    </div>
  );
}

const PENDING_TABLE_PAGE_SIZE = 5;

function ApprovalItemsTable({
  title,
  items: allItems,
  page,
  onPageChange,
  currentAccountId,
  projectGroups,
  actionBusyId,
  onDetail,
  onSignNow,
  onApprove,
  onReject,
  hideDecisionActions = false,
}: {
  title: string;
  items: ApprovalListItem[];
  page: number;
  onPageChange: (page: number) => void;
  currentAccountId?: string;
  projectGroups: Group[];
  actionBusyId: string | null;
  onDetail: (id: string) => void;
  onSignNow: (item: ApprovalListItem) => void;
  onApprove: (item: ApprovalListItem) => void;
  onReject: (item: ApprovalListItem) => void;
  /* Ẩn nút Duyệt/Từ chối — dùng cho khối "Các phê duyệt đã gửi" để Leader tự gửi đơn của mình
   * không thấy nút Duyệt lặp lại ở đây, chỉ thao tác thống nhất từ khối "Quản lý phê duyệt". */
  hideDecisionActions?: boolean;
}) {
  const total = allItems.length;
  const pageCount = Math.max(1, Math.ceil(total / PENDING_TABLE_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const items = allItems.slice((safePage - 1) * PENDING_TABLE_PAGE_SIZE, safePage * PENDING_TABLE_PAGE_SIZE);

  return (
    <section className="space-y-3">
      <h3 className="heading-label">{title}</h3>
      <div className="overflow-x-auto">
        <ListTable
          columns={APPROVAL_COLUMNS}
          minWidth="min-w-[1080px]"
          dense
          stickyHead={false}
          filledHead={false}
        >
          <tbody>
            {items.map((it) => {
              const badge = approvalStatusBadge(it.status);
              const busy = actionBusyId === it.id;
              const canSignWithSmartCa = it.requiresSignature;
              const isSignerForItem = isRequiredSigner(it.signers, currentAccountId, projectGroups);
              const canOpenSmartCa = canSignWithSmartCa && !it.isSigned && isSignerForItem;
              const approvalLockedBySignature = canSignWithSmartCa && !it.isSigned;
              const isTeamLeaderForItem =
                !hideDecisionActions
                && !(it.requiresSignature && !it.isSigned)
                && Boolean(currentAccountId && it.pendingApproverAccountIds?.includes(currentAccountId));
              /* Từ chối: ngoài Team Leader, người/nhóm được asign ký cũng được từ chối thẳng nếu
               * không đồng ý ký (khớp RequireCanDecideAsync(..., allowRequiredSigner: true) ở BE) —
               * chỉ riêng Duyệt vẫn dành riêng cho Team Leader. */
              const canRejectItem = isTeamLeaderForItem || (!hideDecisionActions && canSignWithSmartCa && isSignerForItem);
              return (
                <tr key={it.id} className="border-b border-card-border/60">
                  <td className="cell-wrap py-3 pr-3 align-top font-medium text-text">{it.fileName}</td>
                  <td className="cell-wrap px-3 py-3 align-top text-text-secondary">{it.requestedByName}</td>
                  <td className="cell-wrap px-3 py-3 align-top text-text-secondary">{recipientNames(it)}</td>
                  <td className="px-3 py-3 align-top text-text-secondary">{formatDateTime(it.createdAt)}</td>
                  <td className="px-3 py-3 align-top">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                  </td>
                  <td className="cell-wrap px-3 py-3 align-top text-text-secondary">
                    {canSignWithSmartCa
                      ? (it.isSigned ? t('smartca.status.signed') : t('smartca.signature.required'))
                      : t('approvals.detail.no')}
                  </td>
                  <td className="px-3 py-3 text-right align-top">
                    <RowActions columns={4}>
                      <ActionPillButton onClick={() => onDetail(it.id)}>
                        {t('approvals.action.detail')}
                      </ActionPillButton>
                      {canOpenSmartCa ? (
                        <ActionPillButton tone="primary" onClick={() => onSignNow(it)}>
                          {t('smartca.action.sign')}
                        </ActionPillButton>
                      ) : <span />}
                      {isTeamLeaderForItem ? (
                        <ActionPillButton
                          tone="success"
                          disabled={busy || approvalLockedBySignature}
                          title={approvalLockedBySignature ? t('smartca.error.signatureRequiredBeforeApprove') : undefined}
                          onClick={() => onApprove(it)}
                        >
                          {approvalApproveLabel(it.targetZone)}
                        </ActionPillButton>
                      ) : <span />}
                      {canRejectItem ? (
                        <ActionPillButton tone="danger" disabled={busy} onClick={() => onReject(it)}>
                          {t('approvals.action.reject')}
                        </ActionPillButton>
                      ) : <span />}
                    </RowActions>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </ListTable>
      </div>
      {total > PENDING_TABLE_PAGE_SIZE && (
        <PaginationBar
          page={safePage}
          pageCount={pageCount}
          pageSize={PENDING_TABLE_PAGE_SIZE}
          total={total}
          unit={t('approvals.pending.paginationUnit')}
          variant="inline"
          onChange={onPageChange}
        />
      )}
    </section>
  );
}
