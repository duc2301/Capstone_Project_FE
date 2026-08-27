import { useCallback } from 'react';

import { approvalApi } from '@/entities/approval';

import type { ApprovalMergeFn } from './useApprovalList';
import { upsertApproval, useApprovalList } from './useApprovalList';

/* Danh sách "chờ duyệt": item không còn PendingApproval (đã approve/reject ở nơi khác) thì loại bỏ.
 * Khi đang scope theo 1 dự án cụ thể, item realtime của dự án KHÁC cũng phải bị bỏ qua -- không thì
 * push từ dự án khác vẫn lọt vào danh sách dù fetch ban đầu đã lọc đúng. */
function makeMergePending(projectId?: string): ApprovalMergeFn {
  return (prev, incoming) => {
    if (incoming.status !== 'PendingApproval') return prev.filter((item) => item.id !== incoming.id);
    if (projectId && incoming.projectId !== projectId) return prev.filter((item) => item.id !== incoming.id);
    return upsertApproval(prev, incoming);
  };
}

/* projectId truyền vào khi mở "Danh sách chờ duyệt" từ bên trong 1 dự án -> chỉ lấy request của dự
 * án đó, không gộp lẫn dự án khác mà actor cũng có vai trò (vd Leader nhóm A ở dự án 1 và nhóm B ở
 * dự án 2). Bỏ trống (undefined) khi cần xem tổng hợp mọi dự án (vd Dashboard). */
export function usePendingApprovals(projectId?: string) {
  const loadPendingApprovals = useCallback(
    () => approvalApi.getPendingApprovals(1, 100, projectId),
    [projectId],
  );

  return useApprovalList(loadPendingApprovals, makeMergePending(projectId), `pending-approvals:${projectId ?? 'all'}`);
}
