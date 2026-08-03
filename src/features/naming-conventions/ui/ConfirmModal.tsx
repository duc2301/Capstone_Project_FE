import { Modal } from '@/shared/components';
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
        <p className="modal-text text-danger">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="btn-modal-ghost"
          >
            {t('naming.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="btn-modal-danger"
          >
            {busy ? t('common.loading') : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
