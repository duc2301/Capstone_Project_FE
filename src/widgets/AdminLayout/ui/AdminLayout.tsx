import type { ReactNode } from 'react';
import { Suspense, useState } from 'react';

import { BepTaskToast } from '@/features/projects';

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
    // Shell cố định bằng màn hình; chỉ <main> cuộn.
    <div className="flex h-screen overflow-hidden bg-content-bg">
      <BepTaskToast />

      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main content area (offset by sidebar width on desktop) */}
      <div className={`flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300 ${collapsed ? 'lg:ml-[64px]' : 'lg:ml-[240px]'}`}>
        <AdminTopBar onMenuToggle={() => setSidebarOpen((v) => !v)} />

        <main className="admin-scrollbar min-w-0 flex-1 overflow-y-auto overflow-x-clip p-6 lg:p-8">
          {/* h-full để trang con dùng được h-full thay vì tính calc(100vh - ...) */}
          <div className="mx-auto flex h-full max-w-[1600px] flex-col">
            <Suspense fallback={<ContentFallback />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
