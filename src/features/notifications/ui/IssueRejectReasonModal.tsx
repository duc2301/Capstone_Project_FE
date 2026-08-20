import { useState } from 'react';

import { Modal } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

const REJECT_REASON_MIN = 5;

interface IssueRejectReasonModalProps {
  issueTitle: string;
  busy: boolean;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

export function IssueRejectReasonModal({ issueTitle, busy, onSubmit, onClose }: IssueRejectReasonModalProps) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < REJECT_REASON_MIN;

  return (
    <Modal title={t('issues.assignment.reject')} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="field-hint">{issueTitle}</p>

        <label className="flex flex-col gap-1.5">
          <span className="field-label">{t('issues.assignment.rejectReason')}</span>
          <textarea
            autoFocus
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={busy}
            placeholder={t('issues.assignment.rejectReasonPlaceholder')}
            className="field-input resize-none"
          />
        </label>
        {tooShort && <p className="field-hint text-danger">{t('issues.assignment.rejectReasonRequired')}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="btn-modal-ghost">
            {t('issues.assignment.rejectCancel')}
          </button>
          <button
            type="button"
            disabled={busy || trimmed.length < REJECT_REASON_MIN}
            onClick={() => onSubmit(trimmed)}
            className="btn-modal-danger"
          >
            {busy ? t('common.loading') : t('issues.assignment.rejectSubmit')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
