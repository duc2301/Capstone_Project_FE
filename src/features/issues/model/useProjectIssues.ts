import { useCallback, useEffect, useState } from 'react';

import type { IssuePriority, IssueStatus, ProjectIssueListItem } from '@/entities/issue';
import { issueApi, issueErrorMessage } from '@/entities/issue';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';

export type IssueStatusFilter = 'all' | IssueStatus;
export type IssuePriorityFilter = 'all' | IssuePriority;

interface UseProjectIssuesReturn {
  issues: ProjectIssueListItem[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/** Danh sách issue toàn dự án. BE đã lọc theo quyền View thư mục nên FE không lọc lại. */
export function useProjectIssues(projectId: string): UseProjectIssuesReturn {
  const [issues, setIssues] = useState<ProjectIssueListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const items = await issueApi.getByProject(projectId, 1, 500);
    return sortByNewest(items, (i) => i.createdAt);
  }, [projectId]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setIssues(await load());
    } catch (err) {
      setError(issueErrorMessage(err, t('issues.error')));
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await load();
        if (!cancelled) setIssues(result);
      } catch (err) {
        if (!cancelled) setError(issueErrorMessage(err, t('issues.error')));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { issues, loading, error, reload };
}
