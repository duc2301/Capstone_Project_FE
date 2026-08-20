import { useCallback, useRef, useState } from 'react';

import type { ApprovalListItem, ApprovalListPage } from '@/entities/approval';
import { approvalApi, approvalErrorMessage } from '@/entities/approval';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

import { useApprovalRealtime } from './useApprovalRealtime';

const PAGE_SIZE = 20;
const EMPTY_PAGE: ApprovalListPage = { items: [], total: 0, page: 1, pageSize: PAGE_SIZE };

export function useApprovalHistory() {
  const [page, setPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const requestedPageRef = useRef(1);

  const { data, loading, error, reload } = useAsyncData<ApprovalListPage>(
    'approval-history',
    () => approvalApi.getApprovalsPage(requestedPageRef.current, PAGE_SIZE),
    {
      fallback: EMPTY_PAGE,
      toErrorMessage: (err) => approvalErrorMessage(err, t('approvals.error')),
    },
  );

  const refetch = useCallback(async () => {
    await reload();
  }, [reload]);

  useApprovalRealtime(() => {
    void reload();
  });

  const totalPages = Math.max(1, Math.ceil(data.total / (data.pageSize || PAGE_SIZE)));

  const goToPage = useCallback(
    (next: number) => {
      const maxPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
      const clamped = Math.min(Math.max(1, next), maxPage);
      if (clamped === requestedPageRef.current) return;

      requestedPageRef.current = clamped;
      setPage(clamped);
      setPageLoading(true);
      void reload().finally(() => setPageLoading(false));
    },
    [data.total, reload],
  );

  const items: ApprovalListItem[] = data.items;

  return {
    items,
    total: data.total,
    page,
    pageSize: data.pageSize || PAGE_SIZE,
    totalPages,
    goToPage,
    loading,
    pageLoading,
    error,
    refetch,
  };
}
