import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { useNotifications } from '@/entities/notification';
import { useSession } from '@/entities/session';
import { useLogout } from '@/features/auth';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

/* ── SVG Icon helpers ──────────────────────────────── */
const IconOverview = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconOrganization = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconProjects = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconNotifications = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconProfile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconLogout = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* ── Navigation config ─────────────────────────────── */
interface NavItem {
  labelKey: TranslationKey;
  to: string;
  icon: React.FC;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'admin.nav.overview', to: '/dashboard', icon: IconOverview },
  { labelKey: 'admin.nav.accounts', to: '/accounts', icon: IconProfile },
  { labelKey: 'admin.nav.organizations', to: '/organizations', icon: IconOrganization },
  { labelKey: 'admin.nav.projects', to: '/projects', icon: IconProjects },
  { labelKey: 'admin.nav.notifications', to: '/notifications', icon: IconNotifications },
  { labelKey: 'admin.nav.profile', to: '/profile', icon: IconProfile },
  { labelKey: 'admin.nav.settings', to: '/settings', icon: IconSettings },
];

/* ── Component ─────────────────────────────────────── */
interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { currentUser } = useSession();
  const { unreadCount } = useNotifications();
  const { loading: loggingOut, logout } = useLogout();
  const location = useLocation();

  /* Initials for avatar */
  const initials = (currentUser?.userName ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  /* Active helper */
  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          admin-scrollbar fixed top-0 left-0 z-50 flex h-screen w-[260px] flex-col overflow-y-auto
          bg-sidebar
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:z-30
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ── Brand ──────────────────────────────── */}
        <div className="flex items-center gap-2 px-6 py-5 bg-[#D7DBCA]">
          <span className="font-display text-2xl font-bold text-primary tracking-tight">
            BIM-CDE Portal
          </span>
        </div>

        {/* ── User card ──────────────────────────── */}
        <div className="mx-4 mt-6 mb-4 flex items-center gap-3 rounded-xl bg-white/[0.07] px-4 py-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 text-sm font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {currentUser?.userName ?? 'User'}
            </p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${currentUser?.role?.toString().toLowerCase() === 'admin' ? 'bg-danger' : 'bg-warning text-primary'}`}>
              {currentUser?.role ?? 'Member'}
            </span>
          </div>
        </div>

        {/* ── Navigation ─────────────────────────── */}
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            const badge = item.to === '/notifications' ? unreadCount : item.badge;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`
                  group relative flex items-center gap-3 px-6 py-3
                  text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-white/[0.12] text-white border-l-4 border-warning'
                    : 'text-sidebar-text hover:bg-white/[0.06] hover:text-white border-l-4 border-transparent'
                  }
                `}
              >
                <span className={`transition-colors ${active ? 'text-warning' : 'text-sidebar-text group-hover:text-white'}`}>
                  <Icon />
                </span>
                <span className="flex-1">{t(item.labelKey)}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── Storage bar ────────────────────────── */}
        <div className="mx-4 mt-auto mb-3 rounded-xl bg-white/[0.07] p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-text">
            {t('admin.sidebar.storage')}
          </p>
          <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[75%] rounded-full bg-warning" />
          </div>
          <p className="text-xs text-sidebar-text">
            {t('admin.sidebar.storageUsed')}
          </p>
        </div>

        {/* ── Logout ─────────────────────────────── */}
        <div className="border-t border-white/10 px-3 py-3">
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-sidebar-text transition-all duration-200 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
          >
            <IconLogout />
            <span>{t('admin.sidebar.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
