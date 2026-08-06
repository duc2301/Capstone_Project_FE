import { useEffect, useState } from 'react';

import { PaginationBar } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import type { AuditLogMode } from '../model/useAuditLogs';
import { useAuditLogs } from '../model/useAuditLogs';
import { AuditLogFilters } from './AuditLogFilters';
import { AuditLogTable } from './AuditLogTable';

const SEARCH_DEBOUNCE_MS = 400;

interface Props {
  mode: AuditLogMode;
  /* Bắt buộc khi mode là 'project' | 'my' */
  projectId?: string;
  fileItemId?: string;
  showFilters?: boolean;
  heading?: React.ReactNode;
}

/* Panel nhật ký dùng chung cho cả 3 view (Admin / PM / thành viên).
 * Tiêu đề do trang/tab cha lo — panel chỉ gồm bộ lọc, bảng và phân trang. */
export function AuditLogPanel({ mode, projectId, fileItemId, showFilters = true, heading }: Props) {
  const {
    items, total, page, totalPages, pageSize, loading, error,
    filters, applyFilters, setPage, exportCsv, exporting,
  } = useAuditLogs(mode, projectId, fileItemId);

  const [nameQuery, setNameQuery] = useState('');

  useEffect(() => {
    const term = nameQuery.trim();
    if (term === (filters.search ?? '')) return;

    const timer = setTimeout(() => {
      applyFilters({ ...filters, search: term || undefined });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [nameQuery, filters, applyFilters]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {heading}

      {showFilters && (
        <AuditLogFilters
          value={filters}
          nameValue={nameQuery}
          exporting={exporting}
          showExport={mode !== 'me' && mode !== 'file'}
          searchPlaceholder={mode === 'me' ? t('audit.filter.detailPlaceholder') : undefined}
          onQueryChange={applyFilters}
          onNameChange={setNameQuery}
          onExport={exportCsv}
        />
      )}

      {error ? (
        <div className="rounded-[var(--radius-card)] border border-danger/20 bg-danger-light p-6 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
          <AuditLogTable items={items} loading={loading} />
          {!loading && (
            <PaginationBar
              page={page}
              pageCount={totalPages}
              pageSize={pageSize}
              total={total}
              unit={t('audit.totalSuffix')}
              variant="inline"
              onChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
