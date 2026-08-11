import { t } from '@/shared/lib/i18n';

export function ListLoadingCard() {
  return (
    <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-card-border bg-card py-20 shadow-card">
      <div className="flex flex-col items-center gap-3">
        <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      </div>
    </div>
  );
}

export function ListErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-danger/20 bg-danger-light p-6 text-center">
      <p className="text-sm font-medium text-danger">{message}</p>
    </div>
  );
}
