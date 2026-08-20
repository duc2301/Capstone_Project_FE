import { useCallback, useEffect, useState } from 'react';

import type { PendingIssueAssignment } from '@/entities/issue';
import { issueApi } from '@/entities/issue';

interface UsePendingIssueAssignmentsReturn {
  pendingById: Map<string, PendingIssueAssignment>;
  refreshPendingIssues: () => Promise<void>;
}

export function usePendingIssueAssignments(): UsePendingIssueAssignmentsReturn {
  const [pendingById, setPendingById] = useState<Map<string, PendingIssueAssignment>>(new Map());

  const load = useCallback(async (): Promise<Map<string, PendingIssueAssignment> | null> => {
    try {
      const items = await issueApi.getPendingAssignments();
      return new Map(items.map((item) => [item.issueId, item]));
    } catch {
      return null;
    }
  }, []);

  const refreshPendingIssues = useCallback(async () => {
    const next = await load();
    if (next) setPendingById(next);
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await load();
      if (!cancelled && next) setPendingById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { pendingById, refreshPendingIssues };
}
