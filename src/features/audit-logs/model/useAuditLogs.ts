import { useCallback, useEffect, useState } from 'react';

import type { AuditLogItem, AuditLogQuery } from '@/entities/audit-log';
import { auditLogApi } from '@/entities/audit-log';
import { getApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

/* Nguồn dữ liệu:
 *  - 'system'  : Admin hệ thống, mọi dự án
 *  - 'project' : Admin/PM, toàn bộ 1 dự án
 *  - 'my'      : Thành viên, BE tự lọc theo quyền xem thư mục + nhóm của user */
export type AuditLogMode = 'system' | 'project' | 'my';

const DEFAULT_PAGE_SIZE = 20;

export function useAuditLogs(mode: AuditLogMode, projectId?: string) {
  const [filters, setFilters] = useState<AuditLogQuery>({});
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (mode !== 'system' && !projectId) return;

    setLoading(true);
    setError(null);
    try {
      const query: AuditLogQuery = { ...filters, page, pageSize: DEFAULT_PAGE_SIZE };

      const { data } =
        mode === 'system'
          ? await auditLogApi.getSystem(query)
          : mode === 'project'
            ? await auditLogApi.getByProject(projectId!, query)
            : await auditLogApi.getMine(projectId!, query);

      setItems(data.result?.items ?? []);
      setTotal(data.result?.total ?? 0);
    } catch (e) {
      setError(getApiErrorMessage(e, t('audit.error')));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [mode, projectId, filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  /* Đổi bộ lọc thì luôn quay về trang 1 (tránh rơi vào trang trống) */
  const applyFilters = useCallback((next: AuditLogQuery) => {
    setFilters(next);
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

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
    reload: load,
  };
}
