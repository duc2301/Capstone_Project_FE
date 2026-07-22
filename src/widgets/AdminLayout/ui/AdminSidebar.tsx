import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { useNotifications } from '@/entities/notification';
import { isAccountAdmin, useSession } from '@/entities/session';
import { useLogout } from '@/features/auth';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

/* ── SVG Icon helpers ──────────────────────────────── */
const IconOverview = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconOrganization = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4v18" />
    <path d="M19 21V11l-6-4" />
    <path d="M9 9h1" /><path d="M9 13h1" /><path d="M9 17h1" />
  </svg>
);

const IconProjects = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconPackages = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconAuditLog = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const IconNotifications = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconProfile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconAccounts = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4.354a4 4 0 1 1 0 7.292" />
    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="8" cy="8" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
}

interface NavSection {
  titleKey?: TranslationKey;
  adminOnly?: boolean;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { labelKey: 'admin.nav.overview', to: '/dashboard', icon: IconOverview },
    ],
  },
  {
    titleKey: 'admin.section.system',
    adminOnly: true,
    items: [
      { labelKey: 'admin.nav.organizations', to: '/organizations', icon: IconOrganization },
      { labelKey: 'admin.nav.accounts', to: '/accounts', icon: IconAccounts },
      { labelKey: 'admin.nav.auditLog', to: '/audit-log', icon: IconAuditLog },
    ],
  },
  {
    titleKey: 'admin.section.project',
    items: [
      { labelKey: 'admin.nav.projects', to: '/projects', icon: IconProjects },
      { labelKey: 'admin.nav.packages', to: '/contract-packages', icon: IconPackages },
    ],
  },
  {
    titleKey: 'admin.section.personal',
    items: [
      { labelKey: 'admin.nav.notifications', to: '/notifications', icon: IconNotifications },
      { labelKey: 'admin.nav.profile', to: '/profile', icon: IconProfile },
      { labelKey: 'admin.nav.settings', to: '/settings', icon: IconSettings },
    ],
  },
];

/* ── Component ─────────────────────────────────────── */
interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdminSidebar({ isOpen, onClose, collapsed, onToggleCollapse }: AdminSidebarProps) {
  const { currentUser } = useSession();
  const { unreadCount } = useNotifications();
  const { loading: loggingOut, logout } = useLogout();
  const location = useLocation();

  const isAdmin = isAccountAdmin(currentUser?.role);

  const isCompact = collapsed && !isOpen;

  const visibleSections = NAV_SECTIONS.filter((s) => !s.adminOnly || isAdmin);

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

      {/* Sidebar: brand cố định trên, đăng xuất cố định dưới, chỉ vùng nav ở giữa cuộn. */}
      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-screen flex-col overflow-hidden
          bg-sidebar
          transition-[transform,width] duration-300 ease-in-out
          lg:translate-x-0 lg:z-30
          ${isCompact ? 'w-[64px]' : 'w-[216px]'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ── Brand (cố định) ─────────────────────── */}
        <div className={`flex shrink-0 items-center bg-[#D7DBCA] px-4 py-3.5 ${isCompact ? 'justify-center' : 'justify-between px-5'}`}>
          {!isCompact && (
            <span className="font-display text-xl font-bold text-primary tracking-tight">
              {t('brand.name')}
            </span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCompact ? t('admin.sidebar.expand') : t('admin.sidebar.collapse')}
            aria-label={isCompact ? t('admin.sidebar.expand') : t('admin.sidebar.collapse')}
            className="hidden h-7 w-7 items-center justify-center rounded-lg text-primary/70 transition-colors hover:bg-black/5 hover:text-primary lg:flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isCompact ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
            </svg>
          </button>
        </div>

        {/* ── Navigation (vùng cuộn) ──────────────── */}
        <nav className="admin-scrollbar min-h-0 flex-1 overflow-y-auto px-2.5 pt-3">
          {visibleSections.map((section, idx) => (
            <div key={section.titleKey ?? `top-${idx}`} className={idx === 0 ? '' : 'mt-4'}>
              {section.titleKey && !isCompact && (
                <p className="px-5 pb-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-text/60">
                  {t(section.titleKey)}
                </p>
              )}
              {/* Ở chế độ thu gọn: mỗi nhóm cách nhau bằng gạch mờ thay cho tiêu đề. */}
              {section.titleKey && isCompact && <div className="mx-2 mb-2 h-px bg-white/10" />}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.to);
                  const Icon = item.icon;
                  const badge = item.to === '/notifications' ? unreadCount : undefined;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      title={isCompact ? t(item.labelKey) : undefined}
                      className={`
                        group relative flex items-center gap-2.5 py-2
                        text-sm font-medium transition-all duration-200
                        ${isCompact ? 'justify-center px-0' : 'px-5'}
                        ${active
                          ? 'bg-white/[0.12] text-white border-l-4 border-warning'
                          : 'text-sidebar-text hover:bg-white/[0.06] hover:text-white border-l-4 border-transparent'
                        }
                      `}
                    >
                      <span className={`relative transition-colors ${active ? 'text-warning' : 'text-sidebar-text group-hover:text-white'}`}>
                        <Icon />
                        {/* Thu gọn: chấm đỏ báo có thông báo chưa đọc (không đủ chỗ hiện số). */}
                        {isCompact && badge !== undefined && badge > 0 && (
                          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-sidebar" />
                        )}
                      </span>
                      {!isCompact && <span className="flex-1">{t(item.labelKey)}</span>}
                      {!isCompact && badge !== undefined && badge > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Logout (cố định, cao h-12 = bằng footer để 2 đường gạch thẳng hàng) ── */}
        <div className="flex h-12 shrink-0 items-center border-t border-white/10 px-2.5">
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            title={isCompact ? t('admin.sidebar.logout') : undefined}
            className={`flex w-full items-center gap-2.5 rounded-xl py-2 text-sm font-medium text-sidebar-text transition-all duration-200 hover:bg-white/[0.06] hover:text-white disabled:opacity-50 ${isCompact ? 'justify-center px-0' : 'px-3.5'}`}
          >
            <IconLogout />
            {!isCompact && <span>{t('admin.sidebar.logout')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
