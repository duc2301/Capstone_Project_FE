import { useState } from 'react';

import type { AuditLogItem } from '@/entities/audit-log';
import { Modal } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import { actionBadge, entityLabel, formatLogTime, splitDetail } from '../model/auditFormat';
import { useAuditLogs } from '../model/useAuditLogs';
import { AuditLogPanel } from './AuditLogPanel';

const PREVIEW_COUNT = 5;

interface Props {
  fileItemId: string;
}

export function FileActivitySection({ fileItemId }: Props) {
  const { items, total, loading, error } = useAuditLogs('file', undefined, fileItemId);
  const [allOpen, setAllOpen] = useState(false);

  const preview = items.slice(0, PREVIEW_COUNT);
  const hiddenCount = total - preview.length;

  return (
    <div className="mt-6 border-t border-card-border/70 pt-5">
      <h3 className="heading-label">{t('audit.file.section')}</h3>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-text-muted">{t('common.loading')}</p>
        ) : error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : preview.length === 0 ? (
          <p className="text-sm text-text-muted">{t('audit.file.empty')}</p>
        ) : (
          preview.map((log) => <ActivityRow key={log.id} log={log} />)
        )}

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setAllOpen(true)}
            className="px-2 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            {t('audit.file.showAll').replace('{count}', String(hiddenCount))}
          </button>
        )}
      </div>

      {allOpen && (
        <Modal
          title={t('audit.file.modalTitle')}
          maxWidth="max-w-5xl"
          flush
          onClose={() => setAllOpen(false)}
        >
          <div className="flex min-h-0 flex-1 flex-col px-7 py-6">
            <AuditLogPanel mode="file" fileItemId={fileItemId} showFilters={false} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function ActivityRow({ log }: { log: AuditLogItem }) {
  const action = actionBadge(log.action);
  const detail = splitDetail(log.detail ?? '');

  return (
    <div className="flex gap-3 rounded-[var(--radius-input)] px-2 py-2">
      <span className="mt-0.5 w-1 shrink-0 rounded-full bg-card-border" />
      <div className="min-w-0 flex-1">
        {/* Chip giữ màu hành động; phần mô tả để màu chữ thường cho dễ đọc. */}
        <p className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-[var(--radius-badge)] px-2 py-0.5 text-2xs font-semibold ${action.className}`}>
            {action.label}
          </span>
          <span className="text-xs font-medium text-text">
            {log.detail ? detail.head : entityLabel(log.entityType)}
          </span>
        </p>

        {detail.items.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {detail.items.map((item, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-text-secondary">
                <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-muted" />
                <span className="break-words">{item}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-0.5 text-xs text-text-muted">
          {formatLogTime(log.createdAt)}
          {log.actorName ? ` · ${log.actorName}` : ''}
        </p>
      </div>
    </div>
  );
}
