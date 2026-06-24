import { useEffect, useState } from 'react';

import type { ApprovalDetail } from '@/entities/approval';
import { approvalApi, approvalErrorMessage } from '@/entities/approval';
import { t } from '@/shared/lib/i18n';

import { approvalStatusBadge, formatDateTime } from '../model/approvalFormat';

interface ApprovalDetailModalProps {
  approvalId: string;
  onClose: () => void;
}

function FileIcon() {
  return (
    <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-danger/10 text-danger">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <div className="break-words text-sm font-medium text-text">{value}</div>
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

    return () => {
      cancelled = true;
    };
  }, [approvalId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="absolute inset-0 animate-fade-in" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-6xl animate-scale-in overflow-hidden rounded-3xl bg-[#fbf9f1] shadow-modal">
        {loading ? (
          <div className="flex min-h-[520px] w-full items-center justify-center">
            <p className="text-sm text-text-muted">{t('common.loading')}</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[520px] w-full items-center justify-center px-6 text-center">
            <p className="text-sm font-medium text-danger">{error}</p>
          </div>
        ) : detail ? (
          <ApprovalDetailContent detail={detail} onClose={onClose} />
        ) : null}
      </div>
    </div>
  );
}

function ApprovalDetailContent({ detail, onClose }: { detail: ApprovalDetail; onClose: () => void }) {
  const badge = approvalStatusBadge(detail.status);
  const signatureStatus = detail.requiresSignature
    ? detail.isSigned
      ? t('smartca.status.signed')
      : t('smartca.signature.required')
    : t('approvals.detail.no');

  return (
    <div className="grid w-full grid-cols-1 lg:grid-cols-[1fr_382px]">
      <main className="min-h-[620px] space-y-6 p-6 lg:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <FileIcon />
            <div className="min-w-0">
              <h2 className="truncate font-display text-3xl font-semibold text-text">{detail.fileName}</h2>
              <p className="mt-1 text-sm text-text-muted">{t('approvals.detail.subtitle')}</p>
            </div>
          </div>

          <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
        </header>

        <section className="overflow-hidden rounded-3xl border border-card-border bg-card shadow-card">
          <div className="flex min-h-[470px] items-center justify-center bg-[#dcdad2] p-6">
            <div className="flex w-full max-w-xl flex-col items-center rounded-3xl bg-white p-8 text-center shadow-sm">
              <FileIcon />
              <h3 className="mt-4 max-w-full truncate font-display text-2xl font-semibold text-text">{detail.fileName}</h3>
              <p className="mt-2 max-w-md text-sm text-text-muted">{t('approvals.detail.previewHint')}</p>

              <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
                <InfoTile label={t('approvals.detail.requestedBy')} value={detail.requestedByName || '-'} />
                <InfoTile label={t('approvals.detail.createdAt')} value={formatDateTime(detail.createdAt)} />
                <InfoTile label={t('approvals.detail.requiresSignature')} value={signatureStatus} />
                <InfoTile label={t('approvals.detail.status')} value={badge.label} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <aside className="flex max-h-[92vh] flex-col border-t border-card-border bg-card lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-5">
          <div>
            <h3 className="font-heading text-lg font-bold text-text">{t('approvals.detail.panelTitle')}</h3>
            <p className="mt-1 text-xs text-text-muted">{t('approvals.detail.panelSubtitle')}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="space-y-4">
            <Field label={t('approvals.detail.fileName')} value={detail.fileName} />
            {detail.projectName && <Field label={t('approvals.detail.project')} value={detail.projectName} />}
            {detail.folderName && <Field label={t('approvals.detail.folder')} value={detail.folderName} />}
            <Field label={t('approvals.detail.status')} value={<span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>} />
            <Field label={t('approvals.detail.requiresSignature')} value={signatureStatus} />
            {detail.rejectReason && <Field label={t('approvals.detail.rejectReason')} value={detail.rejectReason} />}
          </section>

          <section className="border-t border-card-border/70 pt-5">
            <h4 className="text-sm font-bold text-text">{t('approvals.detail.timelineTitle')}</h4>
            <div className="relative mt-4 space-y-4">
              <div className="absolute bottom-4 left-4 top-4 w-0.5 bg-card-border/70" />
              <TimelineItem
                active
                title={detail.requestedByName || t('approvals.detail.requestedBy')}
                badge={t('approvals.detail.requesterBadge')}
                body={t('approvals.detail.requestCreated')}
                time={formatDateTime(detail.createdAt)}
              />

              {detail.requiresSignature && (
                <TimelineItem
                  active={detail.isSigned}
                  title={detail.isSigned ? t('smartca.status.signed') : t('smartca.signature.required')}
                  badge={t('smartca.action.sign')}
                  body={detail.isSigned ? t('approvals.detail.signatureDone') : t('approvals.detail.signatureWaiting')}
                  time={detail.isSigned ? t('approvals.detail.completed') : t('approvals.detail.waiting')}
                  tone={detail.isSigned ? 'success' : 'warning'}
                />
              )}

              <TimelineItem
                active={detail.status !== 'PendingApproval'}
                title={detail.approvedByName || t('approvals.detail.approver')}
                badge={detail.status === 'Rejected' ? t('approvals.action.reject') : t('approvals.action.approve')}
                body={detail.status === 'PendingApproval' ? t('approvals.detail.approvalWaiting') : badge.label}
                time={detail.approvedAt ? formatDateTime(detail.approvedAt) : t('approvals.detail.waiting')}
                tone={detail.status === 'Rejected' ? 'danger' : 'success'}
              />
            </div>
          </section>
        </div>

        <div className="border-t border-card-border bg-[#f0eee6] p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            {t('approvals.detail.close')}
          </button>
        </div>
      </aside>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-card-border bg-[#fbf9f1] p-4 text-left">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

interface TimelineItemProps {
  title: string;
  badge: string;
  body: string;
  time: string;
  active?: boolean;
  tone?: 'success' | 'warning' | 'danger';
}

function TimelineItem({ title, badge, body, time, active = false, tone = 'success' }: TimelineItemProps) {
  const toneClass =
    tone === 'danger'
      ? 'bg-danger-light text-danger'
      : tone === 'warning'
        ? 'bg-warning-light text-warning'
        : 'bg-primary/10 text-primary';

  return (
    <div className="relative flex gap-4">
      <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${active ? toneClass : 'bg-content-bg text-text-muted'}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>

      <div className={`flex-1 rounded-2xl border p-4 shadow-sm ${active ? 'border-card-border bg-white' : 'border-card-border/70 bg-white/60 opacity-80'}`}>
        <div className="flex items-start justify-between gap-3">
          <h5 className="text-sm font-bold text-text">{title}</h5>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${toneClass}`}>{badge}</span>
        </div>
        <p className="mt-2 text-xs font-medium text-text-secondary">{body}</p>
        <p className="mt-3 border-t border-card-border/60 pt-3 text-[11px] text-text-muted">{time}</p>
      </div>
    </div>
  );
}
