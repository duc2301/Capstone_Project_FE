import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

const FOOTER_LINKS: TranslationKey[] = [
  'auth.footer.privacy',
  'auth.footer.terms',
  'auth.footer.support',
];

function AuthTopBar() {
  return (
    <header className="absolute top-3 left-1/2 z-20 w-[min(1230px,calc(100%-24px))] -translate-x-1/2">
      <div className="flex h-[44px] items-center justify-between rounded-full border border-white/20 bg-[#FBF9F1]/80 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-md">
        <span className="font-display text-lg font-bold text-[#406623]">
          {t('auth.brand')}
        </span>
        <Link
          to="/"
          className="flex h-8 items-center gap-1.5 rounded-full bg-[#406623] px-4 font-jakarta text-xs font-semibold text-white transition-colors hover:bg-[#34521c]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11.5 12 4l9 7.5" />
            <path d="M5 10v10h14V10" />
          </svg>
          {t('common.backHome')}
        </Link>
      </div>
    </header>
  );
}

function AuthFooter() {
  return (
    <footer className="flex flex-col items-center justify-center gap-1.5 px-4 py-2.5 text-center md:flex-row md:gap-4">
      <p className="font-jakarta text-xs font-medium tracking-[0.6px] text-[#73796B]">
        {t('auth.footer.copyright')}
      </p>
      <nav className="flex items-center gap-4">
        {FOOTER_LINKS.map((key) => (
          <a
            key={key}
            href="#"
            className="font-jakarta text-xs font-medium tracking-[0.6px] text-[#73796B] transition-colors hover:text-[#406623]"
          >
            {t(key)}
          </a>
        ))}
      </nav>
    </footer>
  );
}

interface Props {
  children: ReactNode;
}

export function AuthLayout({ children }: Props) {
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#FBF9F1]">
      <AuthTopBar />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      <AuthFooter />
    </div>
  );
}
