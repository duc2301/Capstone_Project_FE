import { useCallback, useEffect, useState } from 'react';

import type { ZoneReturnRequestItem } from '@/entities/zone-transfer';
import { zoneTransferApi, zoneTransferErrorMessage } from '@/entities/zone-transfer';
import { t } from '@/shared/lib/i18n';

interface UseZoneReturnRequestsReturn {
  items: ZoneReturnRequestItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useZoneReturnRequests(): UseZoneReturnRequestsReturn {
  const [items, setItems] = useState<ZoneReturnRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (showLoading: boolean, isCancelled: () => boolean = () => false) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const data = await zoneTransferApi.getPendingReturnRequests();
      if (!isCancelled()) setItems(data);
    } catch (err) {
      if (!isCancelled()) setError(zoneTransferErrorMessage(err, t('returnRequests.error')));
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, []);

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
