import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type SettingsEntryTone = 'ready' | 'missing';

interface SettingsEntryRowProps {
  icon: ReactNode;
  title: string;
  detail: ReactNode;
  status: { label: string; tone: SettingsEntryTone };
  to: string;
}

const STATUS_TONE: Record<SettingsEntryTone, string> = {
  ready: 'bg-success-light text-success',
  missing: 'bg-warning-light text-warning',
};

const STATUS_DOT: Record<SettingsEntryTone, string> = {
  ready: 'bg-success',
  missing: 'bg-warning',
};

export function SettingsEntryRow({ icon, title, detail, status, to }: Readonly<SettingsEntryRowProps>) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3.5 px-6 py-3.5 transition-colors duration-150 hover:bg-primary-ghost"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="heading-card break-words">{title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
          {detail}
        </div>
      </div>

      <span
        className={`hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold sm:inline-flex ${STATUS_TONE[status.tone]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status.tone]}`} />
        {status.label}
      </span>

      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-text-muted transition-colors duration-150 group-hover:text-primary"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
