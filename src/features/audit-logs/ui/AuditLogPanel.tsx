import { useMemo, useState } from 'react';

import { t } from '@/shared/lib/i18n';
import type { AuditLogMode } from '../model/useAuditLogs';
import { useAuditLogs } from '../model/useAuditLogs';
import { AuditLogFilters } from './AuditLogFilters';
import { AuditLogTable } from './AuditLogTable';

interface Props {
  mode: AuditLogMode;
  /* Bắt buộc khi mode là 'project' | 'my' */
  projectId?: string;
}

/* Dãy số trang gọn có "…" — vd 1 … 4 5 6 … 20. */
function buildPages(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | 'gap')[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) out.push('gap');
  for (let i = left; i <= right; i++) out.push(i);
  if (right < total - 1) out.push('gap');
  out.push(total);
  return out;
}

/* Panel nhật ký dùng chung cho cả 3 view (Admin / PM / thành viên).
 * Tiêu đề do trang/tab cha lo — panel chỉ gồm bộ lọc, bảng và phân trang. */
export function AuditLogPanel({ mode, projectId }: Props) {
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

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="space-y-4">
      <AuditLogFilters
        value={filters}
        nameValue={nameQuery}
        onApply={(next, name) => {
          applyFilters(next);
          setNameQuery(name);
        }}
      />

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger-light px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      )}

      <AuditLogTable items={shown} loading={loading} />

      {!loading && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-text-muted">
            {t('audit.pagination.showing')} <span className="font-semibold text-text">{start}</span>{' '}
            {t('audit.pagination.to')} <span className="font-semibold text-text">{end}</span>{' '}
            {t('audit.pagination.of')} <span className="font-semibold text-text">{total.toLocaleString('vi-VN')}</span>{' '}
            {t('audit.pagination.items')}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-card-border text-text-secondary transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t('audit.prev')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>

            {buildPages(page, totalPages).map((p, i) =>
              p === 'gap' ? (
                <span key={`gap-${i}`} className="px-1.5 text-sm text-text-muted">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors ${
                    p === page
                      ? 'bg-primary text-white'
                      : 'border border-card-border text-text-secondary hover:bg-content-bg'
                  }`}
                >
                  {p}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-card-border text-text-secondary transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t('audit.next')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
