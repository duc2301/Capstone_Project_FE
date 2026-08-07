import { useCallback, useEffect, useMemo, useState } from 'react';

import type { NotificationItem, NotificationQuery } from '@/entities/notification';
import { notificationApi } from '@/entities/notification';
import { getApiErrorMessage } from '@/shared/api';
import type { DateRangeValue } from '@/shared/components';
import { ALL_TIME, resolveDateRange } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

export type NotificationFilter = 'all' | 'unread' | 'invitation';

export const NOTIFICATION_PAGE_SIZE = 10;

export interface NotificationGroup {
  key: string;
  head: NotificationItem;
  count: number;
  hasUnread: boolean;
  ids: string[];
}

export function groupNotifications(items: NotificationItem[]): NotificationGroup[] {
  const groups: NotificationGroup[] = [];

  for (const item of items) {
    const key = `${item.linkType ?? ''}::${item.linkId ?? ''}::${item.message}`;
    const last = groups[groups.length - 1];

    if (last && last.key === key) {
      last.count += 1;
      last.hasUnread = last.hasUnread || !item.isRead;
      last.ids.push(item.id);
      continue;
    }

    groups.push({ key, head: item, count: 1, hasUnread: !item.isRead, ids: [item.id] });
  }

  return groups;
}

export function useNotificationList() {
  const [query, setQueryState] = useState('');
  const [filter, setFilterState] = useState<NotificationFilter>('all');
  const [dateRange, setDateRangeState] = useState<DateRangeValue>(ALL_TIME);
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const requestKey = `${page}|${filter}|${debouncedQuery}|${dateRange.preset}|${dateRange.from ?? ''}|${dateRange.to ?? ''}|${reloadToken}`;
  const loading = loadedKey !== requestKey;

  const reload = useCallback(() => setReloadToken((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const params: NotificationQuery = {
        page,
        pageSize: NOTIFICATION_PAGE_SIZE,
        unreadOnly: filter === 'unread' || undefined,
        linkType: filter === 'invitation' ? 'ProjectInvitation' : undefined,
        search: debouncedQuery || undefined,
        ...resolveDateRange(dateRange),
      };

      try {
        const { data } = await notificationApi.getMine(params);
        if (cancelled) return;
        setError(null);
        setItems(data.result?.items ?? []);
        setTotal(data.result?.total ?? 0);
      } catch (e) {
        if (cancelled) return;
        setError(getApiErrorMessage(e, t('notification.loadError')));
        setItems([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoadedKey(requestKey);
      }
    })();

    return () => { cancelled = true; };
  }, [page, filter, debouncedQuery, dateRange, requestKey]);

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    setPage(1);
  }, []);

  const setFilter = useCallback((value: NotificationFilter) => {
    setFilterState(value);
    setPage(1);
  }, []);

  const setDateRange = useCallback((value: DateRangeValue) => {
    setDateRangeState(value);
    setPage(1);
  }, []);

  const groups = useMemo(() => groupNotifications(items), [items]);
  const pageCount = Math.max(1, Math.ceil(total / NOTIFICATION_PAGE_SIZE));

  return {
    groups,
    total,
    page,
    pageCount,
    loading,
    error,
    query,
    setQuery,
    filter,
    setFilter,
    dateRange,
    setDateRange,
    setPage,
    reload,
  };
}
