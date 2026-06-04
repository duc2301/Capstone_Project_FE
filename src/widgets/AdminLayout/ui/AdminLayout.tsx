import { useState } from 'react';
import type { ReactNode } from 'react';

import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';

interface Props {
  children: ReactNode;
}

export function AdminLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-content-bg">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area (offset by sidebar width on desktop) */}
      <div className="flex flex-1 flex-col lg:ml-[260px]">
        <AdminTopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-card-border bg-content-bg px-6 py-4 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-text-muted sm:flex-row">
            <p>
              <span className="font-bold text-text-secondary">BIM-CDE</span>
              {' '}© 2024 BIM-CDE Portal. Compliant with ISO 19650 / TCVN Standards.
            </p>
            <nav className="flex items-center gap-4">
              <a href="#" className="transition-colors hover:text-text-secondary">Privacy Policy</a>
              <a href="#" className="transition-colors hover:text-text-secondary">System Status</a>
              <a href="#" className="transition-colors hover:text-text-secondary">Compliance Docs</a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
