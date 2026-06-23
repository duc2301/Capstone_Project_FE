import { useCallback, useEffect, useState } from 'react';

import type { ApprovalListItem } from '@/entities/approval';
import { approvalErrorMessage } from '@/entities/approval';
import { t } from '@/shared/lib/i18n';

interface UseApprovalListReturn {
  items: ApprovalListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApprovalList(loader: () => Promise<ApprovalListItem[]>): UseApprovalListReturn {
  const [items, setItems] = useState<ApprovalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (showLoading: boolean, isCancelled: () => boolean = () => false) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const data = await loader();
      if (!isCancelled()) setItems(data);
    } catch (err) {
      if (!isCancelled()) setError(approvalErrorMessage(err, t('approvals.error')));
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [loader]);

  const refetch = useCallback(() => loadItems(false), [loadItems]);

  useEffect(() => {
    let cancelled = false;
    void loadItems(true, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [loadItems]);

  return { items, loading, error, refetch };
}
