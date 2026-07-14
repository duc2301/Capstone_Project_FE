import { useCallback, useEffect, useState } from 'react';

import type { AssignableMember } from '@/entities/issue';
import { issueApi } from '@/entities/issue';

interface UseAssignableMembersReturn {
  members: AssignableMember[];
  loading: boolean;
}

/* Nguoi co the chon lam nguoi thuc hien/tham gia issue cua 1 file — BE tu gioi han theo nhom so huu
 * file neu file dang o vung WIP (vd sau khi issue yeu cau tra file ve WIP duoc duyet), con vung khac
 * (Shared/Published) thi tra ve toan bo thanh vien du an. */
export function useAssignableMembers(fileItemId: string | null | undefined): UseAssignableMembersReturn {
  const [members, setMembers] = useState<AssignableMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (isCancelled: () => boolean = () => false) => {
    if (!fileItemId) return;

    setLoading(true);
    try {
      const data = await issueApi.getAssignableMembers(fileItemId);
      if (!isCancelled()) setMembers(data);
    } catch {
      if (!isCancelled()) setMembers([]);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [fileItemId]);

  useEffect(() => {
    if (!fileItemId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fileItemId, load]);

  return { members, loading };
}
