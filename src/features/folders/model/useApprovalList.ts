import { useCallback } from 'react';

import type { ApprovalListItem } from '@/entities/approval';
import { approvalErrorMessage } from '@/entities/approval';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';

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

const EMPTY_ITEMS: ApprovalListItem[] = [];

export function useApprovalList(
  loader: () => Promise<ApprovalListItem[]>,
  mergeIncoming: ApprovalMergeFn = upsertApproval,
  cacheKey = 'approvals',
): UseApprovalListReturn {
  const fetchItems = useCallback(async () => {
    const data = await loader();
    return sortByNewest(data, (item) => item.createdAt);
  }, [loader]);

  const { data: items, loading, error, setData, reload } = useAsyncData(cacheKey, fetchItems, {
    fallback: EMPTY_ITEMS,
    toErrorMessage: (err) => approvalErrorMessage(err, t('approvals.error')),
  });

  useApprovalRealtime((incoming) => setData((prev) => mergeIncoming(prev, incoming)));

  const refetch = useCallback(async () => reload(), [reload]);

  return { items, loading, error, refetch };
}
