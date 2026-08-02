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
  const confirmClass = tone === 'danger'
    ? 'bg-danger text-white hover:bg-danger/90'
    : 'bg-primary text-white hover:bg-primary-hover';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={busy ? undefined : onCancel} />
      <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-[var(--radius-card-lg)] bg-card p-6 shadow-modal">
        <h2 className="heading-entity">{title}</h2>
        {message && <p className="mt-2 text-sm text-text-secondary">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-[var(--radius-button)] border border-card-border px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-content-bg disabled:opacity-50"
          >
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-[var(--radius-button)] px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${confirmClass}`}
          >
            {confirmLabel ?? t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
