export type ToastType = 'success' | 'error';

export interface ToastMessage {
  msg: string;
  type: ToastType;
}

const TONE = {
  success: { box: 'border-success/30 bg-success-light', text: 'text-success' },
  error: { box: 'border-danger/30 bg-danger-light', text: 'text-danger' },
} as const;

interface ToastProps {
  toast: ToastMessage | null;
  /* Toast bật từ trong modal cần z cao hơn lớp phủ — truyền z-[70] / z-[80]. */
  className?: string;
}

export function Toast({ toast, className = 'z-[60]' }: ToastProps) {
  if (!toast) return null;

  const tone = TONE[toast.type];

  return (
    <div
      className={`fixed right-6 top-20 animate-slide-up rounded-xl border px-5 py-3 shadow-dropdown ${tone.box} ${className}`}
    >
      <p className={`text-sm font-medium ${tone.text}`}>{toast.msg}</p>
    </div>
  );
}
