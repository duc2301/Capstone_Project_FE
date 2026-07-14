import { useCallback, useEffect, useState } from 'react';

import type { AssignableMember } from '@/entities/issue';
import { issueApi, issueErrorMessage } from '@/entities/issue';

interface UseAssignableMembersReturn {
  members: AssignableMember[];
  loading: boolean;
  error: string | null;
}

/* Nguoi co the chon lam nguoi thuc hien/tham gia issue cua 1 file — BE tu gioi han theo nhom so huu
 * file neu file dang o vung WIP (vd sau khi issue yeu cau tra file ve WIP duoc duyet), con vung khac
 * (Shared/Published) thi tra ve toan bo thanh vien du an. */
export function useAssignableMembers(fileItemId: string | null | undefined): UseAssignableMembersReturn {
  const [members, setMembers] = useState<AssignableMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isCancelled: () => boolean = () => false) => {
    if (!fileItemId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await issueApi.getAssignableMembers(fileItemId);
      if (!isCancelled()) setMembers(data);
    } catch (err) {
      if (!isCancelled()) {
        setMembers([]);
        // Khong nuot loi am tham nua — de FE hien thi ro thay vi im lang ra danh sach rong,
        // gay kho chan doan (vd goi API sai/thieu endpoint sau khi deploy code moi).
        setError(issueErrorMessage(err, 'Khong tai duoc danh sach nguoi co the chon.'));
        // eslint-disable-next-line no-console
        console.error('useAssignableMembers failed for fileItemId', fileItemId, err);
      }
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [fileItemId]);

  useEffect(() => {
    if (!fileItemId) {
      setMembers([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    void load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fileItemId, load]);

  return { members, loading, error };
}
