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

export function useZoneReturnRequests(): UseZoneReturnRequestsReturn {
  const fetchItems = useCallback(async () => {
    const data = await zoneTransferApi.getPendingReturnRequests();
    return sortByNewest(data, (item) => item.createdAt);
  }, []);

  const { data: items, loading, error, reload } = useAsyncData('pending-return-requests', fetchItems, {
    fallback: EMPTY_ITEMS,
    toErrorMessage: (err) => zoneTransferErrorMessage(err, t('returnRequests.error')),
  });

  const refetch = useCallback(async () => reload(), [reload]);

  return { items, loading, error, refetch };
}
