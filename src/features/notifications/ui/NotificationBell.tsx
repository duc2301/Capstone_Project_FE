import { useEffect, useRef, useState } from 'react';

import { useNotifications } from '@/entities/notification';
import { t } from '@/shared/lib/i18n';
import { NotificationPanel } from './NotificationPanel';

interface Props {
  variant?: 'admin' | 'header';
}

const BUTTON_STYLES = {
  admin:
    'relative flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-text-muted transition-colors hover:text-text',
  header:
    'relative flex h-9 w-9 items-center justify-center rounded-full border border-[#C3C9B9]/40 bg-[#F0EEE6]/60 text-[#43493C] transition-colors hover:text-[#406623]',
} as const;

export function NotificationBell({ variant = 'admin' }: Props) {
  const { unreadCount, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) void refresh();
      return next;
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={t('notification.title')}
        aria-expanded={open}
        className={BUTTON_STYLES[variant]}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] animate-scale-in overflow-hidden rounded-[var(--radius-card)] border border-card-border bg-card shadow-dropdown">
          <NotificationPanel variant="dropdown" />
        </div>
      )}
    </div>
  );
}
