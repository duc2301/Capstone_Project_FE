import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useSession } from '@/entities/session';
import { NotificationBell } from '@/features/notifications';
import { useBreadcrumbTrail } from '@/shared/lib/breadcrumb';
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
  // Trail động do page đặt (VD: chi tiết dự án); rỗng thì rơi về map tĩnh theo pathname.
  const trail = useBreadcrumbTrail();
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
          {trail.length > 0
            ? trail.map((item, index) => (
              <Fragment key={`${item.label}-${index}`}>
                <span className="text-text-muted">/</span>
                {item.to ? (
                  <Link to={item.to} className="text-text-muted transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                ) : (
                  <span className="max-w-[240px] truncate text-text font-bold">{item.label}</span>
                )}
              </Fragment>
            ))
            : pageLabel && (
              <>
                <span className="text-text-muted">/</span>
                <span className="text-text font-bold">{pageLabel}</span>
              </>
            )}
        </nav>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell + realtime popup */}
        <NotificationBell variant="admin" />

        {/* User avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {initials}
        </div>
      </div>
    </header>
  );
}
