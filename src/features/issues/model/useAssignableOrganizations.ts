import { useEffect, useState } from 'react';

import type { AssignableOrganization } from '@/entities/issue';
import { issueApi } from '@/entities/issue';

export function useAssignableOrganizations(fileItemId: string | null | undefined) {
  const [organizations, setOrganizations] = useState<AssignableOrganization[]>([]);

  useEffect(() => {
    if (!fileItemId) return;
    let stopped = false;

    void (async () => {
      try {
        const data = await issueApi.getAssignableOrganizations(fileItemId);
        if (!stopped) setOrganizations(data);
      } catch {
        if (!stopped) setOrganizations([]);
      }
    })();

    return () => { stopped = true; };
  }, [fileItemId]);

  return { organizations };
}
