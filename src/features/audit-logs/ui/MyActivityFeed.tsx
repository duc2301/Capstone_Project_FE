import type { AuditLogItem } from '@/entities/audit-log';
import { t } from '@/shared/lib/i18n';

import { actionBadge, formatLogTime } from '../model/auditFormat';

interface Props {
  logs: AuditLogItem[];
  loading?: boolean;
  error?: string | null;
}

export function MyActivityFeed({ logs, loading = false, error = null }: Props) {
  if (loading) return <p className="modal-text">{t('common.loading')}</p>;
  if (error) return <p className="modal-text text-danger">{error}</p>;
  if (logs.length === 0) return <p className="modal-text">{t('audit.empty')}</p>;

  return (
    <ul className="space-y-3">
      {logs.map((log) => {
        const badge = actionBadge(log.action);
        return (
          <li
            key={log.id}
            className="flex flex-col gap-1 border-b border-card-border pb-3 last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-2">
              <span
                className={`rounded-[var(--radius-badge)] px-2 py-0.5 text-xs font-semibold ${badge.className}`}
              >
                {badge.label}
              </span>
              <span className="field-hint">{formatLogTime(log.createdAt)}</span>
            </div>
            <p className="text-sm text-text-secondary">
              {log.detail ?? `${log.entityType} · ${log.entityId}`}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
