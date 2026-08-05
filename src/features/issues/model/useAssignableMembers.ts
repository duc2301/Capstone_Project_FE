import { useCallback } from 'react';

import type { AssignableMember } from '@/entities/issue';
import { issueApi, issueErrorMessage } from '@/entities/issue';
import { useAsyncData } from '@/shared/lib/async';

interface UseAssignableMembersReturn {
  members: AssignableMember[];
  loading: boolean;
  error: string | null;
}

const EMPTY_MEMBERS: AssignableMember[] = [];

/* Nguoi co the chon lam nguoi thuc hien/tham gia issue cua 1 file — BE tu gioi han theo nhom so huu
 * file neu file dang o vung WIP (vd sau khi issue yeu cau tra file ve WIP duoc duyet), con vung khac
 * (Shared/Published) thi tra ve toan bo thanh vien du an. */
export function useAssignableMembers(fileItemId: string | null | undefined): UseAssignableMembersReturn {
  const fetchMembers = useCallback(
    () => issueApi.getAssignableMembers(fileItemId!),
    [fileItemId],
  );

  const { data: members, loading, error } = useAsyncData(fileItemId ?? '', fetchMembers, {
    fallback: EMPTY_MEMBERS,
    enabled: Boolean(fileItemId),
    // Khong nuot loi am tham nua — de FE hien thi ro thay vi im lang ra danh sach rong,
    // gay kho chan doan (vd goi API sai/thieu endpoint sau khi deploy code moi).
    toErrorMessage: (err) => issueErrorMessage(err, 'Khong tai duoc danh sach nguoi co the chon.'),
  });

  return { members, loading, error };
}
