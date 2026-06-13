import { useState } from 'react';

import { t } from '@/shared/lib/i18n';
import type {
  NotificationDateRange,
  NotificationFilter,
} from '../model/useNotificationFeed';

interface Props {
  query: string;
  onQueryChange: (v: string) => void;
  filter: NotificationFilter;
  onFilterChange: (f: NotificationFilter) => void;
  dateRange: NotificationDateRange;
  onDateRangeChange: (d: NotificationDateRange) => void;
  hasUnread: boolean;
  onMarkAllRead: () => void;
  onRefresh: () => void;
}

const DATE_OPTIONS: { value: NotificationDateRange; labelKey: Parameters<typeof t>[0] }[] = [
  { value: 'all', labelKey: 'notification.date.all' },
  { value: 'today', labelKey: 'notification.date.today' },
  { value: 'week', labelKey: 'notification.date.week' },
  { value: 'month', labelKey: 'notification.date.month' },
];

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
      className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
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
  const [dateOpen, setDateOpen] = useState(false);

  const toggleFilter = (target: NotificationFilter) => {
    onFilterChange(filter === target ? 'all' : target);
  };

  const selectDate = (value: NotificationDateRange) => {
    onDateRangeChange(value);
    setDateOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-card-border px-6 py-4 lg:px-8">
      {/* Trái: tìm kiếm + lọc nhanh */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-[var(--radius-input)] bg-input-bg px-3.5 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-text-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('notification.search.placeholder')}
            className="w-44 bg-transparent text-sm text-text outline-none placeholder:text-text-placeholder sm:w-56"
          />
        </div>

        <div className="flex items-center gap-2">
          <FilterChip
            active={filter === 'unread'}
            label={t('notification.filter.unread')}
            onClick={() => toggleFilter('unread')}
          />
          <FilterChip
            active={filter === 'important'}
            label={t('notification.filter.important')}
            onClick={() => toggleFilter('important')}
          />
        </div>
      </div>

      {/* Phải: lọc theo ngày + đánh dấu đã đọc + làm mới */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setDateOpen((v) => !v)}
            aria-expanded={dateOpen}
            className="flex items-center gap-2 rounded-[var(--radius-input)] border border-card-border bg-card px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-content-bg"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {t('notification.filter.byDate')}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dateOpen && (
            <>
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setDateOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <div className="absolute right-0 z-20 mt-2 w-44 animate-scale-in overflow-hidden rounded-[var(--radius-input)] border border-card-border bg-card py-1 shadow-dropdown">
                {DATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => selectDate(opt.value)}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-content-bg ${
                      dateRange === opt.value ? 'font-semibold text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {t(opt.labelKey)}
                    {dateRange === opt.value && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

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
