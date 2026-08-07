import type { DateRangeValue } from '@/shared/components';
import { DateRangeFilter } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import type { NotificationFilter } from '../model/useNotificationList';

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  filter: NotificationFilter;
  onFilterChange: (f: NotificationFilter) => void;
  dateRange: DateRangeValue;
  onDateRangeChange: (d: DateRangeValue) => void;
  hasUnread: boolean;
  onMarkAllRead: () => void;
  onRefresh: () => void;
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[var(--radius-button)] border px-4 py-1.5 text-xs transition-colors ${
        active
          ? 'border-primary bg-primary-ghost font-bold text-primary'
          : 'border-card-border font-medium text-text-muted hover:text-text'
      }`}
    >
      {label}
    </button>
  );
}

export function NotificationFeedToolbar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  hasUnread,
  onMarkAllRead,
  onRefresh,
}: Props) {
  const toggleFilter = (target: NotificationFilter) => {
    onFilterChange(filter === target ? 'all' : target);
  };

  return (
    <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-[320px]">
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('notification.search.placeholder')}
            className="w-full rounded-[var(--radius-input)] border border-card-border bg-card py-2.5 pl-11 pr-10 text-sm text-text shadow-card outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <FilterChip
            active={filter === 'unread'}
            label={t('notification.filter.unread')}
            onClick={() => toggleFilter('unread')}
          />
          <FilterChip
            active={filter === 'invitation'}
            label={t('notification.filter.invitation')}
            onClick={() => toggleFilter('invitation')}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <DateRangeFilter value={dateRange} onChange={onDateRangeChange} />

        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={!hasUnread}
          className="flex items-center gap-2 rounded-[var(--radius-input)] border border-primary/15 bg-primary-ghost px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {t('notification.markAllRead')}
        </button>

        <button
          type="button"
          onClick={onRefresh}
          aria-label={t('notification.refresh')}
          title={t('notification.refresh')}
          className="flex h-[42px] w-10 items-center justify-center rounded-[var(--radius-input)] text-text-muted transition-colors hover:bg-content-bg hover:text-text"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
