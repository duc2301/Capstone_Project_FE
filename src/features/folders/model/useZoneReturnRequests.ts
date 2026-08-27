import { useCallback } from 'react';

import type { ZoneReturnRequestItem } from '@/entities/zone-transfer';
import { zoneTransferApi, zoneTransferErrorMessage } from '@/entities/zone-transfer';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';

interface UseZoneReturnRequestsReturn {
  items: ZoneReturnRequestItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const EMPTY_ITEMS: ZoneReturnRequestItem[] = [];

/* projectId truyền vào khi mở từ bên trong 1 dự án -> chỉ lấy request của dự án đó, không gộp lẫn
 * dự án khác mà actor cũng đang lãnh đạo nhóm. */
export function useZoneReturnRequests(projectId?: string): UseZoneReturnRequestsReturn {
  const fetchItems = useCallback(async () => {
    const data = await zoneTransferApi.getPendingReturnRequests(projectId);
    return sortByNewest(data, (item) => item.createdAt);
  }, [projectId]);

  const { data: items, loading, error, reload } = useAsyncData(`pending-return-requests:${projectId ?? 'all'}`, fetchItems, {
    fallback: EMPTY_ITEMS,
    toErrorMessage: (err) => zoneTransferErrorMessage(err, t('returnRequests.error')),
  });

  const refetch = useCallback(async () => reload(), [reload]);

  return { items, loading, error, refetch };
}
