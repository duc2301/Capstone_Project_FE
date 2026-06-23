import { useEffect, useState } from 'react';

import type { ApprovalDetail } from '@/entities/approval';
import { approvalApi, approvalErrorMessage } from '@/entities/approval';
import { t } from '@/shared/lib/i18n';

import { approvalStatusBadge, formatDateTime } from '../model/approvalFormat';

interface ApprovalDetailModalProps {
  approvalId: string;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-card-border/60 py-2.5 last:border-b-0">
      <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-text">{value}</span>
    </div>
  );
}

export function ApprovalDetailModal({ approvalId, onClose }: ApprovalDetailModalProps) {
  const [detail, setDetail] = useState<ApprovalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await approvalApi.getApprovalDetail(approvalId);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) setError(approvalErrorMessage(err, t('approvals.error')));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [approvalId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg animate-scale-in rounded-(--radius-card-lg) bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-text">{t('approvals.detail.title')}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-text-muted">{t('common.loading')}</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-danger">{error}</p>
          ) : detail ? (
            <ApprovalDetailContent detail={detail} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ApprovalDetailContent({ detail }: { detail: ApprovalDetail }) {
  const badge = approvalStatusBadge(detail.status);

  return (
    <div>
      <Row label={t('approvals.detail.fileName')} value={detail.fileName} />
      {detail.projectName && <Row label={t('approvals.detail.project')} value={detail.projectName} />}
      {detail.folderName && <Row label={t('approvals.detail.folder')} value={detail.folderName} />}
      <Row label={t('approvals.detail.requestedBy')} value={detail.requestedByName} />
      <Row label={t('approvals.detail.createdAt')} value={formatDateTime(detail.createdAt)} />
      <Row
        label={t('approvals.detail.status')}
        value={<span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>}
      />
      <Row
        label={t('approvals.detail.requiresSignature')}
        value={detail.requiresSignature ? t('approvals.detail.yes') : t('approvals.detail.no')}
      />
      {detail.approvedByName && <Row label={t('approvals.detail.approver')} value={detail.approvedByName} />}
      {detail.approvedAt && <Row label={t('approvals.detail.approvedAt')} value={formatDateTime(detail.approvedAt)} />}
      {detail.rejectReason && <Row label={t('approvals.detail.rejectReason')} value={detail.rejectReason} />}
    </div>
  );
}
