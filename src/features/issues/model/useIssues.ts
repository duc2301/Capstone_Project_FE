import { useCallback, useEffect, useState } from 'react';

import type { IssueItem } from '@/entities/issue';
import { issueApi, issueErrorMessage } from '@/entities/issue';
import { t } from '@/shared/lib/i18n';

interface UseIssuesReturn {
  items: IssueItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useIssues(fileItemId: string | undefined): UseIssuesReturn {
  const [items, setItems] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (showLoading: boolean, isCancelled: () => boolean = () => false) => {
    if (!fileItemId) return;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const data = await issueApi.getByFileItem(fileItemId);
      if (!isCancelled()) setItems(data);
    } catch (err) {
      if (!isCancelled()) setError(issueErrorMessage(err, t('issues.error')));
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [fileItemId]);

  const refetch = useCallback(() => loadItems(false), [loadItems]);

  useEffect(() => {
    if (!fileItemId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void loadItems(true, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [fileItemId, loadItems]);

  return { items, loading, error, refetch };
}
