import { t } from '@/shared/lib/i18n';

import { approvalStatusBadge, formatDateTime } from '../model/approvalFormat';
import { useApprovalHistory } from '../model/useApprovalHistory';

interface ApprovalHistoryModalProps {
  onClose: () => void;
}

export function ApprovalHistoryModal({ onClose }: ApprovalHistoryModalProps) {
  const { items, loading, error } = useApprovalHistory();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-4xl flex-col animate-scale-in rounded-(--radius-card-lg) bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-text">{t('approvals.history.title')}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-12 text-center text-sm text-text-muted">{t('common.loading')}</p>
          ) : error ? (
            <p className="py-12 text-center text-sm text-danger">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-muted">{t('approvals.history.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    <th className="py-2.5 pr-3 font-bold">{t('approvals.history.colFile')}</th>
                    <th className="px-3 py-2.5 font-bold">{t('approvals.history.colSender')}</th>
                    <th className="px-3 py-2.5 font-bold">{t('approvals.history.colStatus')}</th>
                    <th className="px-3 py-2.5 font-bold">{t('approvals.history.colApprover')}</th>
                    <th className="px-3 py-2.5 font-bold">{t('approvals.history.colApprovedAt')}</th>
                    <th className="px-3 py-2.5 font-bold">{t('approvals.history.colRejectReason')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const badge = approvalStatusBadge(it.status);
                    return (
                      <tr key={it.id} className="border-b border-card-border/60">
                        <td className="py-3 pr-3 font-medium text-text">{it.fileName}</td>
                        <td className="px-3 py-3 text-text-secondary">{it.requestedByName}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                        </td>
                        <td className="px-3 py-3 text-text-secondary">{it.approvedByName ?? '—'}</td>
                        <td className="px-3 py-3 text-text-secondary">{formatDateTime(it.approvedAt)}</td>
                        <td className="px-3 py-3 text-text-secondary">{it.rejectReason ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
