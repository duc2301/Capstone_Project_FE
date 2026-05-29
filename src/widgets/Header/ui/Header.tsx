import { t } from '../../../shared/lib/i18n/translations';

const navKeys = [
  { key: 'header.nav.home', active: true },
  { key: 'header.nav.about', active: false },
  { key: 'header.nav.consult', active: false },
  { key: 'header.nav.guide', active: false },
  { key: 'header.nav.contact', active: false },
] as const;

export const Header = () => {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1200px,calc(100%-32px))]">
      <div className="rounded-full bg-white/95 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-black/5 px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#406623] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M4 21V8l8-5 8 5v13" />
              <path d="M9 21v-6h6v6" />
            </svg>
          </div>
          <span className="font-semibold text-slate-900 text-[15px]">{t('brand.name')}</span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navKeys.map((n) => (
            <a
              key={n.key}
              href="#"
              className={
                n.active
                  ? 'text-[#406623] text-[13px] font-medium relative after:absolute after:-bottom-[18px] after:left-0 after:right-0 after:h-[2px] after:bg-[#406623]'
                  : 'text-slate-600 hover:text-slate-900 text-[13px] transition-colors'
              }
            >
              {t(n.key)}
            </a>
          ))}
        </nav>

        {/* Right: search + login */}
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
          <button
            type="button"
            className="px-5 py-1.5 rounded-full bg-[#406623] text-white text-[13px] font-medium hover:bg-[#34521c] transition-colors"
          >
            {t('header.login')}
          </button>
        </div>
      </div>
    </header>
  );
};
