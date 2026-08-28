import type { AuditLogItem } from '@/entities/audit-log';
import { t } from '@/shared/lib/i18n';
import {
  actionBadge, entityLabel, formatLogClock, formatLogDate, moduleLabel, rowAccentClass, splitDetail,
} from '../model/auditFormat';

interface Props {
  items: AuditLogItem[];
  loading: boolean;
}

const thClass = 'px-5 py-3.5';
const firstThClass = 'px-6 py-3.5';

export function AuditLogTable({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center py-20">
        <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-0 flex-1 py-20 text-center">
        <p className="text-sm text-text-muted">{t('audit.empty')}</p>
      </div>
    );
  }

  return (
    <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
      {/* Cột Nội dung rộng hơn hẳn: log phân quyền giờ liệt kê từng bên/từng người kèm mức quyền. */}
      <table className="table-list min-w-[960px]">
        <colgroup>
          <col className="w-[132px]" />
          <col className="w-[180px]" />
          <col className="w-[146px]" />
          <col className="w-[124px]" />
          <col />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr className="table-head bg-content-bg">
            <th className={firstThClass}>{t('audit.col.time')}</th>
            <th className={thClass}>{t('audit.col.user')}</th>
            <th className={thClass}>{t('audit.col.action')}</th>
            <th className={thClass}>{t('audit.col.module')}</th>
            <th className={thClass}>{t('audit.col.detail')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((log) => {
            const action = actionBadge(log.action);
            const initial = (log.actorName ?? '?').charAt(0).toUpperCase();
            const detail = splitDetail(log.detail ?? '');
            return (
              <tr
                key={log.id}
                className={`border-b border-card-border last:border-b-0 transition-colors hover:bg-content-bg ${rowAccentClass(log.action)}`}
              >
                {/* Thời gian: ngày trên, giờ dưới */}
                <td className="whitespace-nowrap px-6 py-4 align-top">
                  <p className="text-sm font-semibold text-text">{formatLogDate(log.createdAt)}</p>
                  <p className="mt-0.5 text-xs text-text-muted">{formatLogClock(log.createdAt)}</p>
                </td>

                {/* Người dùng: avatar chữ cái + tên */}
                <td className="px-5 py-4 align-top">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                      {initial}
                    </span>
                    <p className="cell-wrap min-w-0 text-sm font-medium text-text">{log.actorName ?? t('audit.unknownActor')}</p>
                  </div>
                </td>

                {/* Thao tác: chip màu — nơi DUY NHẤT mang màu ngữ nghĩa trên dòng */}
                <td className="px-5 py-4 align-top">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${action.className}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {action.label}
                  </span>
                </td>

                {/* Phân hệ (suy diễn) */}
                <td className="cell-wrap px-5 py-4 align-top text-sm text-text-secondary">
                  {moduleLabel(log)}
                </td>

                {/* Nội dung: luôn màu chữ trung tính để đọc được; danh sách phân quyền tách dòng */}
                <td className="px-5 py-4 align-top">
                  <p className="cell-wrap text-sm font-medium text-text">
                    {log.detail ? detail.head : `${entityLabel(log.entityType)} · ${log.entityId}`}
                  </p>

                  {detail.items.length > 0 && (
                    <ul className="mt-1.5 space-y-1">
                      {detail.items.map((item, i) => (
                        <li key={i} className="cell-wrap flex gap-1.5 text-sm text-text-secondary">
                          <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-muted" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {log.detail && log.entityType && (
                    <p className="cell-wrap mt-1.5 text-xs text-text-muted">{entityLabel(log.entityType)}</p>
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
