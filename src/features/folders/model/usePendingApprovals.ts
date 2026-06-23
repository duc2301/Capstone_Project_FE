import { useCallback } from 'react';

import { approvalApi } from '@/entities/approval';

import { useApprovalList } from './useApprovalList';

export function usePendingApprovals() {
  const loadPendingApprovals = useCallback(() => approvalApi.getPendingApprovals(), []);

  return useApprovalList(loadPendingApprovals);
}
