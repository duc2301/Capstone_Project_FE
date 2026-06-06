import { useCallback, useEffect, useState } from 'react';

import { invitationApi } from '@/entities/invitation';

interface UsePendingInvitationsReturn {
  pendingIds: Set<string>;
  refreshPending: () => Promise<void>;
}

export function usePendingInvitations(): UsePendingInvitationsReturn {
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const refreshPending = useCallback(async () => {
    try {
      const { data } = await invitationApi.getMyPending();
      if (data.isSuccess && data.result) {
        setPendingIds(new Set(data.result.map((i) => i.id)));
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await invitationApi.getMyPending();
        if (!cancelled && data.isSuccess && data.result) {
          setPendingIds(new Set(data.result.map((i) => i.id)));
        }
      } catch {
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { pendingIds, refreshPending };
}
