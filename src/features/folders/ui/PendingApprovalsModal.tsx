import { useState } from 'react';

import type { ApprovalListItem } from '@/entities/approval';
import { approvalApi, approvalErrorMessage } from '@/entities/approval';
import type { ZoneReturnRequestItem } from '@/entities/zone-transfer';
import { zoneTransferApi, zoneTransferErrorMessage } from '@/entities/zone-transfer';
import { t } from '@/shared/lib/i18n';

import { approvalStatusBadge, formatDateTime } from '../model/approvalFormat';
import { usePendingApprovals } from '../model/usePendingApprovals';
import { useZoneReturnRequests } from '../model/useZoneReturnRequests';
import { zoneLabel } from '../model/zoneTransferFormat';
import { ApprovalDetailModal } from './ApprovalDetailModal';
import { RejectApprovalModal } from './RejectApprovalModal';
import { RejectReturnModal } from './RejectReturnModal';
import { SmartCaSignModal } from './SmartCaSignModal';

interface PendingApprovalsModalProps {
  onClose: () => void;
  /* Gọi sau khi phê duyệt/từ chối thành công để bên ngoài làm mới danh sách tệp đang xem. */
  onChanged?: () => void;
}

function isWipApproval(approval: ApprovalListItem) {
  return approval.currentZone?.toLowerCase() === 'wip';
}

export function PendingApprovalsModal({ onClose, onChanged }: PendingApprovalsModalProps) {
  const { items, loading, error, refetch } = usePendingApprovals();
  const {
    items: returnRequests,
    loading: returnLoading,
    error: returnError,
    refetch: refetchReturnRequests,
  } = useZoneReturnRequests();
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<ApprovalListItem | null>(null);
  const [rejectFor, setRejectFor] = useState<ApprovalListItem | null>(null);
  const [signFor, setSignFor] = useState<ApprovalListItem | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [confirmReturnApprove, setConfirmReturnApprove] = useState<ZoneReturnRequestItem | null>(null);
  const [rejectReturnFor, setRejectReturnFor] = useState<ZoneReturnRequestItem | null>(null);
  const [returnBusyId, setReturnBusyId] = useState<string | null>(null);
  const approveReturnLabel = 'Duyệt về WIP';
  const rejectReturnLabel = 'Từ chối về WIP';
  const approvalApproveLabel = (targetZone?: string | null) =>
    targetZone ? `Duyệt qua ${targetZone}` : t('approvals.action.approve');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
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
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-4xl flex-col animate-scale-in rounded-(--radius-card-lg) bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-text">{t('approvals.pending.title')}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {loading || returnLoading ? (
            <p className="py-12 text-center text-sm text-text-muted">{t('common.loading')}</p>
          ) : error || returnError ? (
            <p className="py-12 text-center text-sm text-danger">{error ?? returnError}</p>
          ) : items.length === 0 && returnRequests.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-muted">{t('approvals.pending.empty')}</p>
          ) : (
            <div className="space-y-8">
              {items.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-bold text-text">{t('approvals.pending.title')}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-card-border text-left text-[11px] font-bold uppercase tracking-wider text-text-muted">
                          <th className="py-2.5 pr-3 font-bold">{t('approvals.pending.colName')}</th>
                          <th className="px-3 py-2.5 font-bold">{t('approvals.pending.colSender')}</th>
                          <th className="px-3 py-2.5 font-bold">{t('approvals.pending.colDate')}</th>
                          <th className="px-3 py-2.5 font-bold">{t('approvals.pending.colStatus')}</th>
                          <th className="px-3 py-2.5 font-bold">{t('approvals.pending.colSignature')}</th>
                          <th className="px-3 py-2.5 text-right font-bold">{t('approvals.pending.colActions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it) => {
                          const badge = approvalStatusBadge(it.status);
                          const busy = actionBusyId === it.id;
                          const canSignWithSmartCa = it.requiresSignature && isWipApproval(it);
                          const canOpenSmartCa = canSignWithSmartCa && !it.isSigned;
                          const approvalLockedBySignature = canSignWithSmartCa && !it.isSigned;
                          return (
                            <tr key={it.id} className="border-b border-card-border/60">
                              <td className="py-3 pr-3 font-medium text-text">{it.fileName}</td>
                              <td className="px-3 py-3 text-text-secondary">{it.requestedByName}</td>
                              <td className="px-3 py-3 text-text-secondary">{formatDateTime(it.createdAt)}</td>
                              <td className="px-3 py-3">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                              </td>
                              <td className="px-3 py-3 text-text-secondary">
                                {canSignWithSmartCa
                                  ? (it.isSigned ? t('smartca.status.signed') : t('smartca.signature.required'))
                                  : t('approvals.detail.no')}
                              </td>
                              <td className="px-3 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setDetailId(it.id)}
                                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg hover:text-text"
                                  >
                                    {t('approvals.action.detail')}
                                  </button>
                                  {canOpenSmartCa && (
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => setSignFor(it)}
                                      className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                                    >
                                      {t('smartca.action.sign')}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={busy || approvalLockedBySignature}
                                    title={approvalLockedBySignature ? t('smartca.error.signatureRequiredBeforeApprove') : undefined}
                                    onClick={() => setConfirmApprove(it)}
                                    className="rounded-lg bg-success-light px-2.5 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success/20 disabled:opacity-50"
                                  >
                                    {approvalApproveLabel(it.targetZone)}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => setRejectFor(it)}
                                    className="rounded-lg bg-danger-light px-2.5 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
                                  >
                                    {t('approvals.action.reject')}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {returnRequests.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-bold text-text">{t('returnRequests.page.title')}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-card-border text-left text-[11px] font-bold uppercase tracking-wider text-text-muted">
                          <th className="py-2.5 pr-3 font-bold">{t('returnRequests.page.colFile')}</th>
                          <th className="px-3 py-2.5 font-bold">{t('returnRequests.page.colZone')}</th>
                          <th className="px-3 py-2.5 font-bold">{t('returnRequests.page.colRequestedBy')}</th>
                          <th className="px-3 py-2.5 font-bold">{t('returnRequests.page.colReason')}</th>
                          <th className="px-3 py-2.5 font-bold">{t('returnRequests.page.colDate')}</th>
                          <th className="px-3 py-2.5 text-right font-bold">{t('returnRequests.page.colActions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnRequests.map((request) => {
                          const busy = returnBusyId === request.id;
                          return (
                            <tr key={request.id} className="border-b border-card-border/60">
                              <td className="py-3 pr-3 font-medium text-text">{request.fileName}</td>
                              <td className="px-3 py-3 text-text-secondary">{zoneLabel(request.currentZone)}</td>
                              <td className="px-3 py-3 text-text-secondary">{request.requestedByName}</td>
                              <td className="px-3 py-3 text-text-secondary">{request.reason}</td>
                              <td className="px-3 py-3 text-text-secondary">{formatDateTime(request.createdAt)}</td>
                              <td className="px-3 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => setConfirmReturnApprove(request)}
                                    className="rounded-lg bg-success-light px-2.5 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success/20 disabled:opacity-50"
                                  >
                                    {approveReturnLabel}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => setRejectReturnFor(request)}
                                    className="rounded-lg bg-danger-light px-2.5 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
                                  >
                                    {rejectReturnLabel}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`fixed top-20 right-6 z-[70] animate-slide-up rounded-xl border px-5 py-3 shadow-dropdown ${toast.type === 'success' ? 'border-success/30 bg-success-light' : 'border-danger/30 bg-danger-light'}`}>
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-success' : 'text-danger'}`}>{toast.msg}</p>
        </div>
      )}

      {detailId && <ApprovalDetailModal approvalId={detailId} onClose={() => setDetailId(null)} />}

      {signFor && (
        <SmartCaSignModal
          approval={signFor}
          onClose={() => setSignFor(null)}
          onToast={showToast}
          onSigned={() => {
            void refetch();
            onChanged?.();
          }}
        />
      )}

      {confirmApprove && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
          <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={() => (actionBusyId ? undefined : setConfirmApprove(null))} />
          <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-(--radius-card-lg) bg-card p-6 shadow-modal">
            <p className="text-sm font-medium text-text">{t('approvals.confirmApprove.title')}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={!!actionBusyId}
                onClick={() => setConfirmApprove(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-40"
              >
                {t('approvals.confirmApprove.cancel')}
              </button>
              <button
                type="button"
                disabled={!!actionBusyId}
                onClick={handleApprove}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionBusyId ? t('common.loading') : t('approvals.confirmApprove.confirm')}
              </button>
            </div>
          </div>
        </div>
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
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
          <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={() => (returnBusyId ? undefined : setConfirmReturnApprove(null))} />
          <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-(--radius-card-lg) bg-card p-6 shadow-modal">
            <p className="text-sm font-medium text-text">{t('returnRequests.confirmApprove.title')}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={!!returnBusyId}
                onClick={() => setConfirmReturnApprove(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-40"
              >
                {t('returnRequests.confirmApprove.cancel')}
              </button>
              <button
                type="button"
                disabled={!!returnBusyId}
                onClick={handleApproveReturn}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {returnBusyId ? t('common.loading') : t('returnRequests.confirmApprove.confirm')}
              </button>
            </div>
          </div>
        </div>
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
