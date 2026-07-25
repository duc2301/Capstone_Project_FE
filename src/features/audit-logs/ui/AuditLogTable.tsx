import type { AuditLogItem } from '@/entities/audit-log';
import { t } from '@/shared/lib/i18n';
import { actionBadge, formatLogTime, scopeBadge } from '../model/auditFormat';

interface Props {
  items: AuditLogItem[];
  loading: boolean;
  /* Ẩn cột Phạm vi khi đang xem trong 1 dự án (đỡ nhiễu) */
  showScopeColumn?: boolean;
}

export function AuditLogTable({ items, loading, showScopeColumn = true }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-card-border bg-card py-12">
        <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-card-border bg-card py-12 text-center">
        <p className="text-sm text-text-muted">{t('audit.empty')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-card-border bg-content-bg">
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
              {t('audit.col.time')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
              {t('audit.col.actor')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
              {t('audit.col.action')}
            </th>
            {showScopeColumn && (
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                {t('audit.col.scope')}
              </th>
            )}
            <th className="w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
              {t('audit.col.detail')}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((log) => {
            const action = actionBadge(log.action);
            const scope = scopeBadge(log.scope);
            return (
              <tr key={log.id} className="border-b border-card-border last:border-b-0 hover:bg-content-bg">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary">
                  {formatLogTime(log.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-text">
                  {log.actorName ?? t('audit.unknownActor')}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${action.className}`}>
                    {action.label}
                  </span>
                </td>
                {showScopeColumn && (
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${scope.className}`}>
                      {scope.label}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {log.detail ?? `${log.entityType} · ${log.entityId}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
