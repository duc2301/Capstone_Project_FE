import type { ReactNode } from 'react';
import { Suspense, useState } from 'react';

import { t } from '@/shared/lib/i18n';

import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';

function ContentFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
      </svg>
    </div>
  );
}

interface Props {
  children: ReactNode;
}

const COLLAPSE_KEY = 'sidebarCollapsed';

export function AdminLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');

  const toggleCollapse = () =>
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });

  return (
    <div className="flex min-h-screen bg-content-bg">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main content area (offset by sidebar width on desktop) */}
      <div className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ${collapsed ? 'lg:ml-[64px]' : 'lg:ml-[216px]'}`}>
        <AdminTopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />

        <main className="min-w-0 flex-1 overflow-x-clip px-6 pt-6 pb-16 lg:px-8 lg:pt-8">
          <div className="mx-auto max-w-[1400px]">
            <Suspense fallback={<ContentFallback />}>
              {children}
            </Suspense>
          </div>
        </main>

        <footer
          className={`fixed bottom-0 left-0 right-0 z-20 flex h-12 items-center border-t border-card-border bg-content-bg px-6 transition-[left] duration-300 lg:px-8 ${collapsed ? 'lg:left-[64px]' : 'lg:left-[216px]'}`}
        >
          <div className="flex w-full flex-col items-center justify-between gap-0.5 text-xs text-text-muted sm:flex-row sm:gap-2">
            <p>{t('footer.copyright')}</p>
            <nav className="flex items-center gap-4">
              <a href="#" className="transition-colors hover:text-text-secondary">{t('admin.footer.privacy')}</a>
              <a href="#" className="transition-colors hover:text-text-secondary">{t('admin.footer.status')}</a>
              <a href="#" className="transition-colors hover:text-text-secondary">{t('admin.footer.terms')}</a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
