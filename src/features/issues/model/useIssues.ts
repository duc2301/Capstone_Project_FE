import { useCallback } from 'react';

import type { IssueItem } from '@/entities/issue';
import { issueApi, issueErrorMessage } from '@/entities/issue';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';

import { useIssueRealtime } from './useIssueRealtime';

interface UseIssuesReturn {
  items: IssueItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function upsertIssue(prev: IssueItem[], incoming: IssueItem): IssueItem[] {
  return prev.some((item) => item.id === incoming.id)
    ? prev.map((item) => (item.id === incoming.id ? incoming : item))
    : [incoming, ...prev];
}

const EMPTY_ISSUES: IssueItem[] = [];

export function useIssues(fileItemId: string | undefined): UseIssuesReturn {
  const fetchIssues = useCallback(async () => {
    const data = await issueApi.getByFileItem(fileItemId!);
    return sortByNewest(data, (item) => item.createdAt);
  }, [fileItemId]);

  const { data: items, loading, error, setData, reload } = useAsyncData(fileItemId ?? '', fetchIssues, {
    fallback: EMPTY_ISSUES,
    enabled: Boolean(fileItemId),
    toErrorMessage: (err) => issueErrorMessage(err, t('issues.error')),
  });

  useIssueRealtime(fileItemId, {
    onIssueCreated: (issue) => setData((prev) => upsertIssue(prev, issue)),
    onIssueUpdated: (issue) => setData((prev) => upsertIssue(prev, issue)),
  });

  const refetch = useCallback(async () => reload(), [reload]);

  return { items, loading, error, refetch };
}
