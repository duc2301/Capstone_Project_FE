import { t } from '@/shared/lib/i18n';

function pageWindow(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const items: (number | 'gap')[] = [];
  const from = Math.max(2, Math.min(page - 1, pageCount - 3));
  const to = Math.min(pageCount - 1, Math.max(page + 1, 4));

  items.push(1);
  if (from > 2) items.push('gap');
  for (let p = from; p <= to; p += 1) items.push(p);
  if (to < pageCount - 1) items.push('gap');
  items.push(pageCount);

  return items;
}

export interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  const arrowClass =
    'flex h-9 w-9 items-center justify-center rounded-full border border-card-border text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <nav className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={t('common.pagination.prev')}
        className={arrowClass}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {pageWindow(page, pageCount).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-text-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-sm font-semibold transition-colors ${
              item === page
                ? 'bg-primary text-white shadow-sm'
                : 'border border-card-border text-text-secondary hover:bg-content-bg'
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label={t('common.pagination.next')}
        className={arrowClass}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </nav>
  );
}
