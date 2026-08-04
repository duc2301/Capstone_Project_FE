import { useMemo, useState } from 'react';

import { PaginationBar } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import type { AuditLogMode } from '../model/useAuditLogs';
import { useAuditLogs } from '../model/useAuditLogs';
import { AuditLogFilters } from './AuditLogFilters';
import { AuditLogTable } from './AuditLogTable';

interface Props {
  mode: AuditLogMode;
  /* Bắt buộc khi mode là 'project' | 'my' */
  projectId?: string;
  heading?: React.ReactNode;
}

/* Panel nhật ký dùng chung cho cả 3 view (Admin / PM / thành viên).
 * Tiêu đề do trang/tab cha lo — panel chỉ gồm bộ lọc, bảng và phân trang. */
export function AuditLogPanel({ mode, projectId, heading }: Props) {
  const { items, total, page, totalPages, pageSize, loading, error, filters, applyFilters, setPage } =
    useAuditLogs(mode, projectId);

  /* Lọc theo tên người dùng: BE chưa hỗ trợ tìm tên/email -> lọc client-side
     trong phạm vi trang đang tải (đã ghi trong kế hoạch, chờ BE thêm search). */
  const [nameQuery, setNameQuery] = useState('');
  const shown = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => (i.actorName ?? '').toLowerCase().includes(q));
  }, [items, nameQuery]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {heading}

      <AuditLogFilters
        value={filters}
        nameValue={nameQuery}
        onQueryChange={applyFilters}
        onNameChange={setNameQuery}
      />

      {error ? (
        <div className="rounded-[var(--radius-card)] border border-danger/20 bg-danger-light p-6 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
          <AuditLogTable items={shown} loading={loading} />
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
