import { useCallback, useState } from 'react';

import type { AuditLogItem, AuditLogQuery } from '@/entities/audit-log';
import { auditLogApi } from '@/entities/audit-log';
import { getApiErrorMessage } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

/* Nguồn dữ liệu:
 *  - 'system'  : Admin hệ thống, mọi dự án
 *  - 'project' : Admin/PM, toàn bộ 1 dự án
 *  - 'my'      : Thành viên, BE tự lọc theo quyền xem thư mục + nhóm của user */
export type AuditLogMode = 'system' | 'project' | 'my' | 'me' | 'file';

const DEFAULT_PAGE_SIZE = 20;

interface AuditLogPageData {
  items: AuditLogItem[];
  total: number;
}

const EMPTY_PAGE: AuditLogPageData = { items: [], total: 0 };

export function useAuditLogs(mode: AuditLogMode, projectId?: string, fileItemId?: string) {
  const [filters, setFilters] = useState<AuditLogQuery>({});
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const enabled = mode === 'file'
    ? Boolean(fileItemId)
    : mode === 'system' || mode === 'me' || Boolean(projectId);

  const fetchPage = useCallback(async (): Promise<AuditLogPageData> => {
    const query: AuditLogQuery = { ...filters, page, pageSize: DEFAULT_PAGE_SIZE };

    const { data } =
      mode === 'system'
        ? await auditLogApi.getSystem(query)
        : mode === 'me'
          ? await auditLogApi.getMyActivity(query)
          : mode === 'file'
            ? await auditLogApi.getByFileItem(fileItemId!, query)
            : mode === 'project'
              ? await auditLogApi.getByProject(projectId!, query)
              : await auditLogApi.getMine(projectId!, query);

    return { items: data.result?.items ?? [], total: data.result?.total ?? 0 };
  }, [mode, projectId, fileItemId, filters, page]);

  const cacheKey = JSON.stringify({ mode, projectId, fileItemId, filters, page });

  const { data, loading, error, setError, reload } = useAsyncData(cacheKey, fetchPage, {
    fallback: EMPTY_PAGE,
    enabled,
    toErrorMessage: (e) => getApiErrorMessage(e, t('audit.error')),
  });

  const { items, total } = data;

  /* Đổi bộ lọc thì luôn quay về trang 1 (tránh rơi vào trang trống) */
  const applyFilters = useCallback((next: AuditLogQuery) => {
    setFilters(next);
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  const exportCsv = useCallback(async () => {
    if (mode === 'me' || mode === 'file' || (mode !== 'system' && !projectId)) return;

    setExporting(true);
    try {
      const res = mode === 'system'
        ? await auditLogApi.exportSystem(filters)
        : await auditLogApi.exportByProject(projectId!, filters);

      const blobUrl = URL.createObjectURL(res.data as Blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileNameFromDisposition(res.headers['content-disposition']);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setError(getApiErrorMessage(e, t('audit.exportError')));
    } finally {
      setExporting(false);
    }
  }, [mode, projectId, filters, setError]);

  return {
    items,
    total,
    page,
    totalPages,
    pageSize: DEFAULT_PAGE_SIZE,
    loading,
    error,
    filters,
    applyFilters,
    setPage,
    reload,
    exportCsv,
    exporting,
  };
}

function fileNameFromDisposition(disposition: unknown): string {
  const raw = typeof disposition === 'string' ? disposition : '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(raw);
  return match ? decodeURIComponent(match[1]) : 'audit-log.csv';
}
