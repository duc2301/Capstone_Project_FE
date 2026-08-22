import { Modal } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

/* Các mảnh giao diện dùng chung cho các modal phân quyền (nhóm & thành viên):
 * vỏ modal, ô tìm kiếm, ô đánh dấu chọn, cụm nút mũi tên di chuyển giữa 2 panel.
 * Tách riêng để modal phân quyền nhóm và modal phân quyền thành viên dùng chung
 * một bố cục — chỉ khác nguồn dữ liệu và ô chọn mức quyền ở panel phải.
 * (Helper toggleInSet nằm ở model/toggleInSet để file này chỉ export component.) */

/* Ô đánh dấu chọn item (để di chuyển giữa 2 panel) */
export function SelectBox({ checked }: { checked: boolean }) {
  return checked ? (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary text-white">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  ) : (
    <span className="h-5 w-5 shrink-0 rounded-md border-2 border-card-border bg-card" />
  );
}

export function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('folderPermission.searchPlaceholder')}
        className="w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg py-2 pl-9 pr-3 text-sm text-text outline-none focus:border-input-focus"
      />
    </div>
  );
}

/* Cụm 2 nút mũi tên di chuyển item giữa panel trái và phải */
export function MoveArrows({ canMoveRight, canMoveLeft, onMoveRight, onMoveLeft }: {
  canMoveRight: boolean;
  canMoveLeft: boolean;
  onMoveRight: () => void;
  onMoveLeft: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 md:flex-col">
      <button
        type="button"
        disabled={!canMoveRight}
        onClick={onMoveRight}
        title={t('folderPermission.moveRight')}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          canMoveRight
            ? 'border-primary bg-primary text-white hover:bg-primary-hover'
            : 'cursor-not-allowed border-card-border text-text-muted opacity-50'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 md:rotate-0">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
      <button
        type="button"
        disabled={!canMoveLeft}
        onClick={onMoveLeft}
        title={t('folderPermission.moveLeft')}
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          canMoveLeft
            ? 'border-primary bg-primary text-white hover:bg-primary-hover'
            : 'cursor-not-allowed border-card-border text-text-muted opacity-50'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 md:rotate-0">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
      </button>
    </div>
  );
}

interface PermissionModalShellProps {
  title: string;
  resourceName: string;
  loading: boolean;
  /** Đã có dữ liệu để dựng phần thân — false khi đang tải hoặc lỗi. */
  ready: boolean;
  /** Thông báo lỗi (đã dịch) khi tải thất bại. */
  error: string | null;
  onClose: () => void;
  children: React.ReactNode;
}

/* Vỏ modal phân quyền: lớp phủ + thẻ + tiêu đề, và trạng thái tải/lỗi.
 * Khi đã sẵn sàng thì render `children` (phần thân + footer riêng của từng modal). */
export function PermissionModalShell({
  title, resourceName, loading, ready, error, onClose, children,
}: PermissionModalShellProps) {
  return (
    <Modal title={title} subtitle={resourceName} onClose={onClose} maxWidth="max-w-4xl" flush>
      {ready ? (
        children
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <p className="py-16 text-center text-sm text-text-muted">{t('common.loading')}</p>
            ) : (
              <p className="py-16 text-center text-sm text-danger">{error ?? t('folderPermission.error')}</p>
            )}
          </div>
          <div className="flex justify-end border-t border-card-border px-6 py-4">
            <button type="button" onClick={onClose} className="btn-modal-ghost">
              {t('documents.action.cancel')}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
