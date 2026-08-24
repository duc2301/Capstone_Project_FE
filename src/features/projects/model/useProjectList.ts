import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { Project, ProjectListQuery, ProjectStatusName } from '@/entities/project';
import { projectApi } from '@/entities/project';
import { isAccountAdmin, useSession } from '@/entities/session';
import { getApiErrorMessage } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

const PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 300;

/** '' = mọi trạng thái (không gửi param). */
export type ProjectStatusFilter = '' | ProjectStatusName;

interface ProjectPageData {
  items: Project[];
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const EMPTY_PAGE: ProjectPageData = {
  items: [],
  totalCount: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export interface UseProjectListReturn {
  projects: Project[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  /** Giá trị ô tìm kiếm (cập nhật tức thì; đẩy vào URL sau debounce). */
  search: string;
  setSearch: (value: string) => void;
  status: ProjectStatusFilter;
  setStatus: (value: ProjectStatusFilter) => void;
  ownerOrganizationId: string;
  setOwnerOrganizationId: (value: string) => void;
  setPage: (page: number) => void;
  reload: () => Promise<void>;
}

/**
 * Danh sách dự án lái theo server: tìm kiếm / lọc / phân trang gửi thành query
 * params, KHÔNG lọc cả danh sách ở client. Toàn bộ trạng thái (trang + bộ lọc)
 * được lưu trên URL query string để refresh / back đều khôi phục đúng.
 */
export function useProjectList(): UseProjectListReturn {
  const { currentUser } = useSession();
  const isAdmin = isAccountAdmin(currentUser?.role);

  const [searchParams, setSearchParams] = useSearchParams();

  // URL là nguồn sự thật cho việc fetch.
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const search = searchParams.get('q') ?? '';
  const status = (searchParams.get('status') as ProjectStatusFilter) || '';
  const ownerOrganizationId = searchParams.get('org') ?? '';

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (nextPage: number) =>
      updateParams((p) => {
        if (nextPage <= 1) p.delete('page');
        else p.set('page', String(nextPage));
      }, false),
    [updateParams],
  );

  const setStatus = useCallback(
    (value: ProjectStatusFilter) =>
      updateParams((p) => {
        if (value) p.set('status', value);
        else p.delete('status');
      }),
    [updateParams],
  );

  const setOwnerOrganizationId = useCallback(
    (value: string) =>
      updateParams((p) => {
        if (value) p.set('org', value);
        else p.delete('org');
      }),
    [updateParams],
  );

  // Ô tìm kiếm cập nhật tức thì; debounce mới ghi vào URL (và reset về trang 1).
  const [searchInput, setSearchInput] = useState(search);
  // Đồng bộ ngược khi URL đổi từ bên ngoài (back/forward) bằng cách chỉnh state
  // ngay trong render (không dùng effect) — không đè lúc user đang gõ vì `q` trên
  // URL chỉ đổi sau debounce.
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setSearchInput(search);
  }

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === search) return;
    const id = setTimeout(() => {
      updateParams((p) => {
        if (trimmed) p.set('q', trimmed);
        else p.delete('q');
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput, search, updateParams]);

  const fetchPage = useCallback(async (): Promise<ProjectPageData> => {
    const query: ProjectListQuery = {
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      status: status || undefined,
      ownerOrganizationId: ownerOrganizationId || undefined,
    };

    // Cùng contract phân trang; admin thấy mọi dự án (/projects), người dùng
    // thường chỉ thấy dự án của mình (/projects/mine). BE lọc, ta chỉ đọc trang.
    const { data } = isAdmin
      ? await projectApi.getAll(query)
      : await projectApi.getMine(query);
    const result = data.result;
    return {
      items: result?.items ?? [],
      totalCount: result?.totalCount ?? 0,
      totalPages: Math.max(1, result?.totalPages ?? 1),
      hasNextPage: result?.hasNextPage ?? false,
      hasPreviousPage: result?.hasPreviousPage ?? false,
    };
  }, [isAdmin, page, search, status, ownerOrganizationId]);

  const cacheKey = `projects:${isAdmin ? 'all' : 'mine'}|${page}|${search}|${status}|${ownerOrganizationId}`;

  const { data, loading, error, reload } = useAsyncData(cacheKey, fetchPage, {
    fallback: EMPTY_PAGE,
    toErrorMessage: (e) => getApiErrorMessage(e, t('common.error')),
  });

  // Nếu trang hiện tại vượt quá tổng trang (vd. bộ lọc thu hẹp kết quả), lùi về trang cuối.
  useEffect(() => {
    if (!loading && page > data.totalPages) setPage(data.totalPages);
  }, [loading, page, data.totalPages, setPage]);

  return {
    projects: data.items,
    totalCount: data.totalCount,
    totalPages: data.totalPages,
    page: Math.min(page, data.totalPages),
    pageSize: PAGE_SIZE,
    loading,
    error,
    search: searchInput,
    setSearch: setSearchInput,
    status,
    setStatus,
    ownerOrganizationId,
    setOwnerOrganizationId,
    setPage,
    reload,
  };
}
