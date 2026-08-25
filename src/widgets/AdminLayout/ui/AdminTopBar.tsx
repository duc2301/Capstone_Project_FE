import { useLocation, useNavigate } from 'react-router-dom';

import { NotificationBell } from '@/features/notifications';
import { t } from '@/shared/lib/i18n';

import { hasInAppHistory, resolveBackTarget } from '../model/backTarget';
import { UserMenu } from './UserMenu';

interface AdminTopBarProps {
  onMenuToggle: () => void;
}

export function AdminTopBar({ onMenuToggle }: AdminTopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/dashboard';

  const goBack = () => {
    if (hasInAppHistory()) {
      navigate(-1);
      return;
    }
    const fallback = resolveBackTarget(location.pathname, location.search);
    navigate(fallback ?? '/dashboard', { replace: true });
  };

  return (
    <header className="relative z-30 flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border-sage bg-page-cream px-8 backdrop-blur-[6px]">
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] text-text-muted transition-colors hover:bg-card hover:text-text lg:hidden"
          aria-label={t('admin.menu.toggle')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Back */}
        {!isHome && (
          <button
            type="button"
            onClick={goBack}
            aria-label={t('projectDetail.back')}
            title={t('projectDetail.back')}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-card hover:text-text"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        )}

      </div>

      {/* Right: actions */}
      <div className="flex shrink-0 items-center gap-3">
        {/* Notification bell + realtime popup */}
        <NotificationBell variant="admin" />

        {/* User name + avatar */}
        <UserMenu />
      </div>
    </header>
  );
}
