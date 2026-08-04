import { useState } from 'react';

import type { ZoneName } from '@/entities/zone-transfer';
import { t } from '@/shared/lib/i18n';

import { zoneLabel } from '../model/zoneTransferFormat';

interface ReturnRequestModalProps {
  fileName: string;
  currentZone: ZoneName;
  busy: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function ReturnRequestModal({ fileName, currentZone, busy, onClose, onSubmit }: ReturnRequestModalProps) {
  const [reason, setReason] = useState('');
  const canSubmit = reason.trim().length > 0 && !busy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-md animate-scale-in rounded-[var(--radius-card-lg)] bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <div className="min-w-0">
            <h2 className="heading-entity">{t('returnRequests.modal.title')}</h2>
            <p className="field-hint truncate">{fileName}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:opacity-40">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="field-label">{t('returnRequests.modal.currentZone')}</span>
            <input
              readOnly
              value={zoneLabel(currentZone)}
              className="field-input-readonly"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="field-label">{t('returnRequests.modal.reasonLabel')}</span>
            <textarea
              autoFocus
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy}
              placeholder={t('returnRequests.modal.reasonPlaceholder')}
              className="field-input resize-none"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-card-border px-6 py-4">
          <button type="button" onClick={onClose} disabled={busy} className="btn-modal-ghost">
            {t('returnRequests.modal.cancel')}
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onSubmit(reason.trim())}
            className="btn-modal-primary"
          >
            {busy ? t('common.loading') : t('returnRequests.modal.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
