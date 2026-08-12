import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useNotifications } from '@/entities/notification';
import { useSession } from '@/entities/session';
import { useLogout } from '@/features/auth';
import { useProfile } from '@/features/profile';
import { UserAvatar } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

interface MenuLink {
  key: string;
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

const ITEM_CLASS =
  'flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-content-bg hover:text-text';

export function UserMenu() {
  const { currentUser } = useSession();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const { loading: loggingOut, logout } = useLogout();

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

  const userName = currentUser?.userName ?? '';
  const email = profile?.email ?? '';

  const links: MenuLink[] = [
    {
      key: 'profile',
      to: '/profile',
      label: t('admin.userMenu.profile'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      key: 'activity',
      to: '/profile?tab=activity',
      label: t('admin.userMenu.activity'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      ),
    },
    {
      key: 'notifications',
      to: '/notifications',
      label: t('admin.userMenu.notifications'),
      badge: unreadCount,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      key: 'home',
      to: '/',
      label: t('admin.userMenu.home'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
      ),
    },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t('admin.userMenu.open')}
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full py-0.5 pl-2 pr-0.5 transition-colors hover:bg-card"
      >
        <span className="hidden whitespace-nowrap text-sm font-semibold text-text sm:inline">
          {userName}
        </span>
        <UserAvatar userName={userName} avatarUrl={profile?.avatarUrl} size="sm" rounded="full" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] animate-scale-in overflow-hidden rounded-[var(--radius-card)] border border-card-border bg-card py-1.5 shadow-dropdown">
          <div className="border-b border-card-border px-4 pb-3 pt-2">
            <p className="heading-label truncate">{userName}</p>
            {email && <p className="field-hint truncate">{email}</p>}
          </div>

          <div className="py-1.5">
            {links.map((item) => (
              <Link key={item.key} to={item.to} onClick={() => setOpen(false)} className={ITEM_CLASS}>
                <span className="shrink-0 text-text-muted">{item.icon}</span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-danger px-1 text-2xs font-bold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="border-t border-card-border pt-1.5">
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className={`w-full text-danger hover:bg-danger-light hover:text-danger disabled:opacity-50 ${ITEM_CLASS}`}
            >
              <span className="shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              <span className="min-w-0 flex-1 truncate text-left">{t('admin.sidebar.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
