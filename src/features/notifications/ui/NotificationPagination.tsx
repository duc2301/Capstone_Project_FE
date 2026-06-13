import { t } from '@/shared/lib/i18n';

interface Props {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

export function NotificationPagination({ page, pageCount, onChange }: Props) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  const arrowClass =
    'flex h-10 w-10 items-center justify-center rounded-[var(--radius-input)] border border-card-border text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <nav className="flex items-center justify-center gap-2 py-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={t('notification.pagination.prev')}
        className={arrowClass}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`flex h-10 min-w-10 items-center justify-center rounded-[var(--radius-input)] px-3 text-sm font-semibold transition-colors ${
            p === page
              ? 'bg-primary text-white shadow-sm'
              : 'border border-card-border text-text-secondary hover:bg-content-bg'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label={t('notification.pagination.next')}
        className={arrowClass}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </nav>
  );
}
