import { useCallback } from 'react';

import { approvalApi } from '@/entities/approval';

import type { ApprovalMergeFn } from './useApprovalList';
import { upsertApproval, useApprovalList } from './useApprovalList';

/* Danh sách "chờ duyệt": item không còn PendingApproval (đã approve/reject ở nơi khác) thì loại bỏ. */
const mergePending: ApprovalMergeFn = (prev, incoming) =>
  incoming.status === 'PendingApproval'
    ? upsertApproval(prev, incoming)
    : prev.filter((item) => item.id !== incoming.id);

export function usePendingApprovals() {
  const loadPendingApprovals = useCallback(() => approvalApi.getPendingApprovals(), []);

  return useApprovalList(loadPendingApprovals, mergePending);
}
