import { t } from '@/shared/lib/i18n';

import { Pagination } from './Pagination';

export interface PaginationBarProps {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  unit: string;
  variant?: 'card' | 'inline';
  onChange: (page: number) => void;
}

export function PaginationBar({
  page, pageCount, pageSize, total, unit, variant = 'card', onChange,
}: PaginationBarProps) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const shell = variant === 'card'
    ? 'rounded-[var(--radius-card)] border border-card-border bg-card px-5 py-3 shadow-card'
    : 'border-t border-card-border/60 px-6 py-3.5';

  return (
    <div className={`flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${shell}`}>
      <p className="text-sm text-text-muted">
        {t('common.pagination.showing')}{' '}
        <span className="font-semibold text-text">{from} – {to}</span>{' '}
        {t('common.pagination.of')}{' '}
        <span className="font-semibold text-text">{total}</span>{' '}
        {unit}
      </p>
      <Pagination page={page} pageCount={pageCount} onChange={onChange} />
    </div>
  );
}
