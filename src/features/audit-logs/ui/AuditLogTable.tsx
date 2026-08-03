import type { AuditLogItem } from '@/entities/audit-log';
import { t } from '@/shared/lib/i18n';
import { actionBadge, detailTone, formatLogClock, formatLogDate, moduleLabel } from '../model/auditFormat';

const DETAIL_TONE_CLASS = {
  danger: 'font-semibold text-danger',
  warning: 'font-semibold text-warning',
  normal: 'font-medium text-text',
} as const;

interface Props {
  items: AuditLogItem[];
  loading: boolean;
}

const thClass = 'px-5 py-3.5';

export function AuditLogTable({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-card-border bg-card py-16">
        <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-card-border bg-card py-16 text-center">
        <p className="text-sm text-text-muted">{t('audit.empty')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-card-border bg-card shadow-card">
      <table className="w-full min-w-[820px] border-collapse">
        <thead>
          <tr className="table-head">
            <th className={thClass}>{t('audit.col.time')}</th>
            <th className={thClass}>{t('audit.col.user')}</th>
            <th className={thClass}>{t('audit.col.action')}</th>
            <th className={thClass}>{t('audit.col.module')}</th>
            <th className={`${thClass} w-full`}>{t('audit.col.detail')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((log) => {
            const action = actionBadge(log.action);
            const initial = (log.actorName ?? '?').charAt(0).toUpperCase();
            return (
              <tr key={log.id} className="border-b border-card-border last:border-b-0 transition-colors hover:bg-content-bg">
                {/* Thời gian: ngày trên, giờ UTC dưới */}
                <td className="whitespace-nowrap px-5 py-4 align-top">
                  <p className="text-sm font-semibold text-text">{formatLogDate(log.createdAt)}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{formatLogClock(log.createdAt)}</p>
                </td>

                {/* Người dùng: avatar chữ cái + tên */}
                <td className="whitespace-nowrap px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                      {initial}
                    </span>
                    <p className="text-sm font-medium text-text">{log.actorName ?? t('audit.unknownActor')}</p>
                  </div>
                </td>

                {/* Thao tác: pill + chấm màu cùng tông chữ */}
                <td className="whitespace-nowrap px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${action.className}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    {action.label}
                  </span>
                </td>

                {/* Phân hệ (suy diễn) */}
                <td className="whitespace-nowrap px-5 py-4 text-sm text-text-secondary">
                  {moduleLabel(log)}
                </td>

                {/* Chi tiết: dòng chính + phụ. Màu theo tính chất hành động, không theo vị trí dòng. */}
                <td className="px-5 py-4">
                  <p className={`text-sm ${DETAIL_TONE_CLASS[detailTone(log.action)]}`}>
                    {log.detail ?? `${log.entityType} · ${log.entityId}`}
                  </p>
                  {log.detail && log.entityType && (
                    <p className="mt-0.5 text-xs text-text-muted">{log.entityType}</p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
