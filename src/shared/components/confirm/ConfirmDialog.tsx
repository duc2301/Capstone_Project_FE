import { t } from '@/shared/lib/i18n';

interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmClass = tone === 'danger' ? 'btn-modal-danger' : 'btn-modal-primary';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={busy ? undefined : onCancel} />
      <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-[var(--radius-card-lg)] bg-card p-6 shadow-modal">
        <h2 className="heading-entity">{title}</h2>
        {message && <p className="modal-text mt-2">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="btn-modal-ghost"
          >
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={confirmClass}
          >
            {confirmLabel ?? t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
