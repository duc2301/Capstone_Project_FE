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
import type { ListTableColumn } from '@/shared/components';
import { ActionPillButton, ConfirmDialog, ListErrorCard, ListLoadingCard, ListTable, PaginationBar, RowActions, Toast, useToast } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

const PAGE_SIZE = 20;

const RETURN_REQUEST_COLUMNS: ListTableColumn[] = [
  { key: 'file', label: t('returnRequests.page.colFile'), width: 'w-[22%]' },
  { key: 'zone', label: t('returnRequests.page.colZone'), width: 'w-[120px]' },
  { key: 'requestedBy', label: t('returnRequests.page.colRequestedBy'), width: 'w-[150px]' },
  { key: 'reason', label: t('returnRequests.page.colReason') },
  { key: 'date', label: t('returnRequests.page.colDate'), width: 'w-[150px]' },
  { key: 'status', label: t('returnRequests.page.colStatus'), width: 'w-[130px]' },
  { key: 'actions', label: t('common.col.actions'), width: 'w-[190px]', align: 'right' },
];

export function ReturnRequestManagementPage() {
  const { items, loading, error, refetch } = useZoneReturnRequests();
  const [confirmApprove, setConfirmApprove] = useState<ZoneReturnRequestItem | null>(null);
  const [rejectFor, setRejectFor] = useState<ZoneReturnRequestItem | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { toast, showToast } = useToast();

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

  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <Toast toast={toast} className="z-[60]" />

      <h1 className="heading-page shrink-0">{t('returnRequests.page.title')}</h1>

      {loading ? (
        <ListLoadingCard />
      ) : error ? (
        <ListErrorCard message={error} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
            <ListTable columns={RETURN_REQUEST_COLUMNS} minWidth="min-w-[1020px]">
              <tbody className="divide-y divide-card-border">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-text-muted">
                      {t('returnRequests.page.empty')}
                    </td>
                  </tr>
                ) : (
                  paged.map((req) => {
                    const badge = returnRequestStatusBadge(req.status);
                    const busy = actionBusyId === req.id;
                    return (
                      <tr key={req.id} className="transition-colors duration-150 hover:bg-content-bg">
                        <td className="cell-wrap px-6 py-4 align-top font-semibold text-text">{req.fileName}</td>
                        <td className="cell-wrap px-5 py-4 align-top text-text-secondary">{zoneLabel(req.currentZone)}</td>
                        <td className="cell-wrap px-5 py-4 align-top text-text-secondary">{req.requestedByName}</td>
                        <td className="cell-wrap px-5 py-4 align-top text-text-secondary">{req.reason}</td>
                        <td className="px-5 py-4 align-top text-text-muted">{formatDateTime(req.createdAt)}</td>
                        <td className="px-5 py-4 align-top">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <RowActions>
                            <ActionPillButton tone="success" disabled={busy} onClick={() => setConfirmApprove(req)}>
                              {t('returnRequests.page.approve')}
                            </ActionPillButton>
                            <ActionPillButton tone="danger" disabled={busy} onClick={() => setRejectFor(req)}>
                              {t('returnRequests.page.reject')}
                            </ActionPillButton>
                          </RowActions>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </ListTable>
          </div>

          <PaginationBar
            page={currentPage}
            pageCount={pageCount}
            pageSize={PAGE_SIZE}
            total={items.length}
            unit={t('returnRequests.paginationUnit')}
            variant="inline"
            onChange={setPage}
          />
        </div>
      )}

      {confirmApprove && (
        <ConfirmDialog
          title={t('returnRequests.confirmApprove.title')}
          confirmLabel={t('returnRequests.confirmApprove.confirm')}
          cancelLabel={t('returnRequests.confirmApprove.cancel')}
          tone="primary"
          busy={!!actionBusyId}
          onConfirm={handleApprove}
          onCancel={() => setConfirmApprove(null)}
        />
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
