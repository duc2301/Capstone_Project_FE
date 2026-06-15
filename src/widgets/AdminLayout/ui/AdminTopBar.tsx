import { useLocation } from 'react-router-dom';

import { useSession } from '@/entities/session';
import { NotificationBell } from '@/features/notifications';
import { t } from '@/shared/lib/i18n';

/* ── Breadcrumb mapping ────────────────────────────── */
const BREADCRUMB_MAP: Record<string, string> = {
  '/accounts': 'QUẢN LÝ TÀI KHOẢN',
  '/organizations': 'QUẢN LÝ TỔ CHỨC',
  '/profile': 'HỒ SƠ',
  '/dashboard': 'TỔNG QUAN',
  '/projects': 'DỰ ÁN CỦA TÔI',
  '/notifications': 'THÔNG BÁO',
  '/settings': 'CÀI ĐẶT',
  '/teams': 'ĐỘI NGŨ',
  '/documents': 'QUẢN LÝ TÀI LIỆU',
  '/discussions': 'THẢO LUẬN',
};

interface AdminTopBarProps {
  onMenuToggle: () => void;
}

export function AdminTopBar({ onMenuToggle }: AdminTopBarProps) {
  const location = useLocation();
  const { currentUser } = useSession();
  const pageLabel = BREADCRUMB_MAP[location.pathname] ?? '';

  const initials = (currentUser?.userName ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-card-border bg-content-bg/80 px-6 backdrop-blur-md lg:px-8">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-card hover:text-text lg:hidden"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold tracking-wider">
          <span className="text-text-muted">{t('admin.topbar.breadcrumb.home')}</span>
          {pageLabel && (
            <>
              <span className="text-text-muted">/</span>
              <span className="text-text font-bold">{pageLabel}</span>
            </>
          )}
        </nav>
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden items-center gap-2 rounded-full border border-card-border bg-card px-4 py-2 sm:flex">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder={t('admin.topbar.search')}
            className="w-44 bg-transparent font-jakarta text-sm text-text outline-none placeholder:text-text-placeholder"
          />
        </div>

        {/* Notification bell + realtime popup */}
        <NotificationBell variant="admin" />

        {/* Help */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-card-border bg-card text-text-muted transition-colors hover:text-text"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>

        {/* User avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {initials}
        </div>
      </div>
    </header>
  );
}
