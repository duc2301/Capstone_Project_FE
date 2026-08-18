import { useCallback, useEffect, useRef, useState } from 'react';

import type { ApprovalListItem, ApprovalListPage } from '@/entities/approval';
import { approvalApi, approvalErrorMessage } from '@/entities/approval';
import { t } from '@/shared/lib/i18n';

import { useApprovalRealtime } from './useApprovalRealtime';

const PAGE_SIZE = 20;
const EMPTY_PAGE: ApprovalListPage = { items: [], total: 0, page: 1, pageSize: PAGE_SIZE };

export function useApprovalHistory() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApprovalListPage>(EMPTY_PAGE);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async (targetPage: number) => {
    const requestId = ++requestIdRef.current;
    setPageLoading(true);
    try {
      const result = await approvalApi.getApprovalsPage(targetPage, PAGE_SIZE);
      if (requestId !== requestIdRef.current) return;
      setData(result);
      setError(null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(approvalErrorMessage(err, t('approvals.error')));
    } finally {
      if (requestId !== requestIdRef.current) return;
      setPageLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useApprovalRealtime(() => {
    void load(page);
  });

  const refetch = useCallback(async () => {
    await load(page);
  }, [load, page]);

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  const goToPage = useCallback((next: number) => {
    setPage((current) => {
      const maxPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
      const clamped = Math.min(Math.max(1, next), maxPage);
      return clamped === current ? current : clamped;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.total]);

  const items: ApprovalListItem[] = data.items;

  return {
    items,
    total: data.total,
    page,
    pageSize: data.pageSize,
    totalPages,
    goToPage,
    loading: initialLoading,
    pageLoading,
    error,
    refetch,
  };
}
