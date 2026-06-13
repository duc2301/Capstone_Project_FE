import { useCallback, useMemo, useState } from 'react';

import type { NotificationItem } from '@/entities/notification';

export type NotificationFilter = 'all' | 'unread' | 'important';
export type NotificationDateRange = 'all' | 'today' | 'week' | 'month';

const PAGE_SIZE = 8;

const DATE_RANGE_DAYS: Record<Exclude<NotificationDateRange, 'all' | 'today'>, number> = {
  week: 7,
  month: 30,
};

interface Params {
  notifications: NotificationItem[];
  isPendingInvite: (n: NotificationItem) => boolean;
}

interface UseNotificationFeedReturn {
  query: string;
  setQuery: (v: string) => void;
  filter: NotificationFilter;
  setFilter: (f: NotificationFilter) => void;
  dateRange: NotificationDateRange;
  setDateRange: (d: NotificationDateRange) => void;
  page: number;
  setPage: (p: number) => void;
  pageCount: number;
  totalFiltered: number;
  visible: NotificationItem[];
}

function withinDateRange(iso: string, range: NotificationDateRange): boolean {
  if (range === 'all') return true;

  const date = new Date(iso);
  if (range === 'today') {
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  const limitMs = DATE_RANGE_DAYS[range] * 24 * 60 * 60 * 1000;
  return Date.now() - date.getTime() <= limitMs;
}

function matchesFilter(
  n: NotificationItem,
  filter: NotificationFilter,
  isPendingInvite: (n: NotificationItem) => boolean,
): boolean {
  if (filter === 'unread') return !n.isRead;
  if (filter === 'important') return isPendingInvite(n);
  return true;
}

export function useNotificationFeed({
  notifications,
  isPendingInvite,
}: Params): UseNotificationFeedReturn {
  const [query, setQueryState] = useState('');
  const [filter, setFilterState] = useState<NotificationFilter>('all');
  const [dateRange, setDateRangeState] = useState<NotificationDateRange>('all');
  const [page, setPage] = useState(1);

  const setQuery = useCallback((v: string) => {
    setQueryState(v);
    setPage(1);
  }, []);

  const setFilter = useCallback((f: NotificationFilter) => {
    setFilterState(f);
    setPage(1);
  }, []);

  const setDateRange = useCallback((d: NotificationDateRange) => {
    setDateRangeState(d);
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifications.filter((n) => {
      if (!matchesFilter(n, filter, isPendingInvite)) return false;
      if (!withinDateRange(n.sendAt, dateRange)) return false;
      if (!q) return true;
      return (
        n.message.toLowerCase().includes(q) ||
        n.senderName.toLowerCase().includes(q)
      );
    });
  }, [notifications, query, filter, dateRange, isPendingInvite]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  return {
    query,
    setQuery,
    filter,
    setFilter,
    dateRange,
    setDateRange,
    page: safePage,
    setPage,
    pageCount,
    totalFiltered: filtered.length,
    visible,
  };
}
