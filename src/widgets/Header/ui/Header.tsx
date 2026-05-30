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
  { labelKey: 'header.nav.about', to: '#', routed: false },
  { labelKey: 'header.nav.consult', to: '#', routed: false },
  { labelKey: 'header.nav.guide', to: '#', routed: false },
  { labelKey: 'header.nav.contact', to: '#', routed: false },
  { labelKey: 'header.nav.accounts', to: '/accounts', routed: true, authOnly: true },
];

const INACTIVE_LINK = 'text-slate-600 hover:text-slate-900 text-[13px] transition-colors';
const ACTIVE_LINK =
  'text-[#406623] text-[13px] font-medium relative after:absolute after:-bottom-[18px] after:left-0 after:right-0 after:h-[2px] after:bg-[#406623]';

export const Header = () => {
  const { currentUser, isAuthenticated } = useSession();
  const { loading: loggingOut, logout } = useLogout();

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1200px,calc(100%-32px))]">
      <div className="rounded-full bg-white/95 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-black/5 px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#406623] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M4 21V8l8-5 8 5v13" />
              <path d="M9 21v-6h6v6" />
            </svg>
          </div>
          <span className="font-semibold text-slate-900 text-[15px]">{t('brand.name')}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
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
              <a key={item.labelKey} href={item.to} className={INACTIVE_LINK}>
                {t(item.labelKey)}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-sm text-slate-400 w-40">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder={t('header.search.placeholder')}
              className="bg-transparent outline-none text-xs flex-1 placeholder:text-slate-400"
            />
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[13px] font-medium text-slate-700 max-w-[120px] truncate">
                {currentUser?.userName}
              </span>
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="px-5 py-1.5 rounded-full border border-[#406623] text-[#406623] text-[13px] font-medium hover:bg-[#406623]/5 disabled:opacity-50 transition-colors"
              >
                {t('header.logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/register"
                className="hidden sm:inline text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {t('header.register')}
              </Link>
              <Link
                to="/login"
                className="px-5 py-1.5 rounded-full bg-[#406623] text-white text-[13px] font-medium hover:bg-[#34521c] transition-colors"
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
