import { useState } from 'react';

import type { ZoneReturnRequestItem } from '@/entities/zone-transfer';
import { zoneTransferApi, zoneTransferErrorMessage } from '@/entities/zone-transfer';
import {
  formatDateTime,
  RejectReturnModal,
  returnRequestStatusBadge,
  useZoneReturnRequests,
  zoneLabel,
} from '@/features/folders';
import { t } from '@/shared/lib/i18n';

export function ReturnRequestManagementPage() {
  const { items, loading, error, refetch } = useZoneReturnRequests();
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<ZoneReturnRequestItem | null>(null);
  const [rejectFor, setRejectFor] = useState<ZoneReturnRequestItem | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async () => {
    if (!confirmApprove) return;
    setActionBusyId(confirmApprove.id);
    try {
      await zoneTransferApi.approveReturnRequest(confirmApprove.id);
      showToast(t('returnRequests.toast.approved'));
      setConfirmApprove(null);
      await refetch();
    } catch (err) {
      showToast(zoneTransferErrorMessage(err, t('common.error')), 'error');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleReject = async (rejectReason: string) => {
    if (!rejectFor) return;
    setActionBusyId(rejectFor.id);
    try {
      await zoneTransferApi.rejectReturnRequest(rejectFor.id, rejectReason);
      showToast(t('returnRequests.toast.rejected'));
      setRejectFor(null);
      await refetch();
    } catch (err) {
      showToast(zoneTransferErrorMessage(err, t('common.error')), 'error');
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-20 right-6 z-[60] animate-slide-up rounded-xl border px-5 py-3 shadow-dropdown ${toast.type === 'success' ? 'border-success/30 bg-success-light' : 'border-danger/30 bg-danger-light'}`}>
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-success' : 'text-danger'}`}>{toast.msg}</p>
        </div>
      )}

      <div>
        <h1 className="font-heading text-2xl font-bold text-text lg:text-3xl">{t('returnRequests.page.title')}</h1>
        <p className="mt-1 text-sm text-text-muted">{t('returnRequests.page.description')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-(--radius-card) border border-card-border bg-card py-20 shadow-card">
          <p className="text-sm text-text-muted">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="rounded-(--radius-card) border border-danger/20 bg-danger-light p-6 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-(--radius-card) border border-card-border bg-card shadow-card">
          {items.length === 0 ? (
            <p className="py-16 text-center text-sm text-text-muted">{t('returnRequests.page.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-input-bg">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">{t('returnRequests.page.colFile')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">{t('returnRequests.page.colZone')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">{t('returnRequests.page.colRequestedBy')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">{t('returnRequests.page.colReason')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">{t('returnRequests.page.colDate')}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">{t('returnRequests.page.colStatus')}</th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-text-muted">{t('returnRequests.page.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {items.map((req) => {
                    const badge = returnRequestStatusBadge(req.status);
                    const busy = actionBusyId === req.id;
                    return (
                      <tr key={req.id} className="transition-colors duration-150 hover:bg-primary-ghost">
                        <td className="px-6 py-4 font-semibold text-text">{req.fileName}</td>
                        <td className="px-6 py-4 text-text-secondary">{zoneLabel(req.currentZone)}</td>
                        <td className="px-6 py-4 text-text-secondary">{req.requestedByName}</td>
                        <td className="px-6 py-4 text-text-secondary">{req.reason}</td>
                        <td className="px-6 py-4 text-text-muted">{formatDateTime(req.createdAt)}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setConfirmApprove(req)}
                              className="rounded-lg bg-success-light px-2.5 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success/20 disabled:opacity-50"
                            >
                              {t('returnRequests.page.approve')}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setRejectFor(req)}
                              className="rounded-lg bg-danger-light px-2.5 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
                            >
                              {t('returnRequests.page.reject')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {confirmApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={() => (actionBusyId ? undefined : setConfirmApprove(null))} />
          <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-(--radius-card-lg) bg-card p-6 shadow-modal">
            <p className="text-sm font-medium text-text">{t('returnRequests.confirmApprove.title')}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={!!actionBusyId}
                onClick={() => setConfirmApprove(null)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-40"
              >
                {t('returnRequests.confirmApprove.cancel')}
              </button>
              <button
                type="button"
                disabled={!!actionBusyId}
                onClick={handleApprove}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionBusyId ? t('common.loading') : t('returnRequests.confirmApprove.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectFor && (
        <RejectReturnModal
          fileName={rejectFor.fileName}
          busy={actionBusyId === rejectFor.id}
          onClose={() => setRejectFor(null)}
          onSubmit={handleReject}
        />
      )}
    </div>
  );
}
