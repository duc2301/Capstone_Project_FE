import { useCallback } from 'react';

import { approvalApi } from '@/entities/approval';

import { useApprovalList } from './useApprovalList';

export function useApprovalHistory() {
  const loadApprovalHistory = useCallback(() => approvalApi.getApprovals(), []);

  return useApprovalList(loadApprovalHistory);
}
