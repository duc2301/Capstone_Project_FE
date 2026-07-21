import type { ReactNode } from 'react';
import { useState } from 'react';

import { t } from '@/shared/lib/i18n';

import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';

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
      <div className={`flex flex-1 flex-col transition-[margin] duration-300 ${collapsed ? 'lg:ml-[64px]' : 'lg:ml-[216px]'}`}>
        <AdminTopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-card-border bg-content-bg px-6 py-4 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-text-muted sm:flex-row">
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
