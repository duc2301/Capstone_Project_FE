import { Modal } from '@/shared/components/modal';
import { t } from '@/shared/lib/i18n';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/* Modal xác nhận hành động nguy hiểm (xóa) — nút đỏ, khóa khi đang xử lý. */
export function ConfirmModal({ title, message, confirmLabel, busy = false, onConfirm, onClose }: ConfirmModalProps) {
  return (
    <Modal title={title} onClose={busy ? () => undefined : onClose} maxWidth="max-w-md">
      <div className="space-y-6">
        <p className="text-sm text-danger">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-40"
          >
            {t('naming.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-xl bg-danger px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger/90 disabled:opacity-50"
          >
            {busy ? t('common.loading') : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
