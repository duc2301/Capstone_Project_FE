import { useState } from 'react';

import type { AuditLogQuery } from '@/entities/audit-log';
import { AuditAction, LogScope } from '@/entities/audit-log';
import { t } from '@/shared/lib/i18n';
import { actionBadge, scopeBadge } from '../model/auditFormat';

interface Props {
  value: AuditLogQuery;
  onApply: (next: AuditLogQuery) => void;
  /* View Admin có thêm ô lọc theo dự án; view trong dự án thì không cần */
  showScopeFilter?: boolean;
}

const SCOPES = [LogScope.System, LogScope.Project, LogScope.Group];
const ACTIONS = Object.values(AuditAction);

const inputClass =
  'rounded-xl border border-card-border bg-card px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary';

export function AuditLogFilters({ value, onApply, showScopeFilter = true }: Props) {
  const [draft, setDraft] = useState<AuditLogQuery>(value);

  const set = <K extends keyof AuditLogQuery>(key: K, v: AuditLogQuery[K]) =>
    setDraft((d) => ({ ...d, [key]: v }));

  const clear = () => {
    const empty: AuditLogQuery = {};
    setDraft(empty);
    onApply(empty);
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-card-border bg-card p-4">
      {showScopeFilter && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-text-muted">{t('audit.filter.scope')}</span>
          <select
            className={inputClass}
            value={draft.scope ?? ''}
            onChange={(e) => set('scope', e.target.value === '' ? undefined : (Number(e.target.value) as never))}
          >
            <option value="">{t('audit.filter.all')}</option>
            {SCOPES.map((s) => (
              <option key={s} value={s}>{scopeBadge(s).label}</option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-text-muted">{t('audit.filter.action')}</span>
        <select
          className={inputClass}
          value={draft.action ?? ''}
          onChange={(e) => set('action', e.target.value === '' ? undefined : (Number(e.target.value) as never))}
        >
          <option value="">{t('audit.filter.all')}</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{actionBadge(a).label}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-text-muted">{t('audit.filter.from')}</span>
        <input
          type="date"
          className={inputClass}
          value={draft.from ?? ''}
          onChange={(e) => set('from', e.target.value || undefined)}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-text-muted">{t('audit.filter.to')}</span>
        <input
          type="date"
          className={inputClass}
          value={draft.to ?? ''}
          onChange={(e) => set('to', e.target.value || undefined)}
        />
      </label>

      <button
        type="button"
        onClick={() => onApply(draft)}
        className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        {t('audit.filter.apply')}
      </button>
      <button
        type="button"
        onClick={clear}
        className="rounded-xl border border-card-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg"
      >
        {t('audit.filter.clear')}
      </button>
    </div>
  );
}
