import { Link, NavLink } from 'react-router-dom';

import { useSession } from '@/entities/session';
import { useLogout } from '@/features/auth';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

interface NavItem {
  labelKey: TranslationKey;
  to: string;
  routed: boolean;
  authOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'header.nav.home', to: '/', routed: true },
  { labelKey: 'header.nav.about', to: '/about', routed: true },
  { labelKey: 'header.nav.consult', to: '#', routed: false },
  { labelKey: 'header.nav.contact', to: '#', routed: false },
  { labelKey: 'header.nav.accounts', to: '/accounts', routed: true, authOnly: true },
];

const INACTIVE_LINK =
  'font-jakarta text-sm font-semibold tracking-[0.14px] text-[#43493C] hover:text-[#406623] transition-colors';
const ACTIVE_LINK =
  'font-jakarta text-sm font-semibold tracking-[0.14px] text-[#406623] relative after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-0.5 after:bg-[#406623]';

export const Header = () => {
  const { currentUser, isAuthenticated } = useSession();
  const { loading: loggingOut, logout } = useLogout();

  return (
    <header className="fixed top-5 left-1/2 z-50 w-[min(1216px,calc(100%-32px))] -translate-x-1/2">
      <div className="flex h-[68px] items-center justify-between rounded-full border border-white/20 bg-white/20 px-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] backdrop-blur-md">
        <Link
          to="/"
          className="font-display text-2xl font-bold text-[#406623]"
        >
          {t('brand.name')}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.filter((item) => !item.authOnly || isAuthenticated).map((item) =>
            item.routed ? (
              <NavLink
                key={item.labelKey}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => (isActive ? ACTIVE_LINK : INACTIVE_LINK)}
              >
                {t(item.labelKey)}
              </NavLink>
            ) : (
              <button
                key={item.labelKey}
                type="button"
                className={`${INACTIVE_LINK} cursor-default`}
                aria-disabled="true"
              >
                {t(item.labelKey)}
              </button>
            ),
          )}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border border-[#C3C9B9]/30 bg-[#F0EEE6]/50 px-4 py-1.5 text-[#43493C]/70 sm:flex">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder={t('header.search.placeholder')}
              className="w-28 bg-transparent font-jakarta text-sm outline-none placeholder:text-[#43493C]/70"
            />
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-[120px] truncate font-jakarta text-sm font-medium text-[#43493C] sm:inline">
                {currentUser?.userName}
              </span>
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="rounded-full border border-[#406623] px-6 py-2.5 font-jakarta text-sm font-semibold tracking-[0.14px] text-[#406623] transition-colors hover:bg-[#406623]/5 disabled:opacity-50"
              >
                {t('header.logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/register"
                className="hidden font-jakarta text-sm font-semibold tracking-[0.14px] text-[#43493C] transition-colors hover:text-[#406623] sm:inline"
              >
                {t('header.register')}
              </Link>
              <Link
                to="/login"
                className="rounded-full bg-[#406623] px-6 py-2.5 font-jakarta text-sm font-semibold tracking-[0.14px] text-white transition-colors hover:bg-[#34521c]"
              >
                {t('header.login')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
