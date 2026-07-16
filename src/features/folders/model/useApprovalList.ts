import { useCallback, useEffect, useState } from 'react';

import type { ApprovalListItem } from '@/entities/approval';
import { approvalErrorMessage } from '@/entities/approval';
import { t } from '@/shared/lib/i18n';

import { useApprovalRealtime } from './useApprovalRealtime';

interface UseApprovalListReturn {
  items: ApprovalListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/* Cách vá 1 approval vừa đổi (từ realtime) vào mảng items hiện tại. */
export type ApprovalMergeFn = (prev: ApprovalListItem[], incoming: ApprovalListItem) => ApprovalListItem[];

/* Mặc định: có id trong mảng thì thay tại chỗ, chưa có thì thêm vào đầu. */
export const upsertApproval: ApprovalMergeFn = (prev, incoming) =>
  prev.some((item) => item.id === incoming.id)
    ? prev.map((item) => (item.id === incoming.id ? incoming : item))
    : [incoming, ...prev];

export function useApprovalList(
  loader: () => Promise<ApprovalListItem[]>,
  mergeIncoming: ApprovalMergeFn = upsertApproval,
): UseApprovalListReturn {
  const [items, setItems] = useState<ApprovalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useApprovalRealtime((incoming) => setItems((prev) => mergeIncoming(prev, incoming)));

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
