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
  /* Câu mô tả nhỏ dưới tiêu đề — mỗi view một ngữ cảnh khác nhau */
  subtitle?: string;
}

/* Panel nhật ký dùng chung cho cả 3 view (Admin / PM / thành viên).
 * Khác biệt duy nhất là `mode` -> hook gọi đúng endpoint, còn lọc quyền do BE lo. */
export function AuditLogPanel({ mode, projectId, subtitle }: Props) {
  const { items, total, page, totalPages, pageSize, loading, error, filters, applyFilters, setPage } =
    useAuditLogs(mode, projectId);

  const inProject = mode !== 'system';

  return (
    <div className="space-y-4">
      <div>
        {/* Trong dự án panel này là 1 tab -> theo chuẩn tiêu đề tab; trang riêng thì
            nó nằm dưới h1 nên giữ cỡ nhỏ để không đè tiêu đề trang */}
        <h2 className={inProject
          ? 'heading-tab'
          : 'text-lg font-bold text-text'}
        >
          {t('audit.title')}
        </h2>
        <p className="text-sm text-text-muted">{subtitle ?? t('audit.subtitle')}</p>
      </div>

      <AuditLogFilters value={filters} onApply={applyFilters} showScopeFilter={!inProject} />

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      )}

      <AuditLogTable items={items} loading={loading} showScopeColumn={!inProject} />

      {!loading && (
        <PaginationBar
          page={page}
          pageCount={totalPages}
          pageSize={pageSize}
          total={total}
          unit={t('audit.totalSuffix')}
          onChange={setPage}
        />
      )}
    </div>
  );
}
