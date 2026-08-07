import { useState } from 'react';

import type { AuditLogQuery } from '@/entities/audit-log';
import { AuditAction, LogScope } from '@/entities/audit-log';
import type { DateRangeValue } from '@/shared/components';
import { ALL_TIME, DateRangeFilter, resolveDateRange } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import { actionBadge, scopeBadge } from '../model/auditFormat';

interface Props {
  value: AuditLogQuery;
  nameValue: string;
  exporting: boolean;
  showExport?: boolean;
  searchPlaceholder?: string;
  onQueryChange: (next: AuditLogQuery) => void;
  onNameChange: (name: string) => void;
  onExport: () => void;
}

const SCOPES = [LogScope.System, LogScope.Project, LogScope.Group];
const ACTIONS = Object.values(AuditAction);

const SEARCH_CLASS =
  'w-full rounded-[var(--radius-input)] border border-card-border bg-card py-2.5 pl-11 pr-10 text-sm text-text shadow-card outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';
const SELECT_CLASS =
  'rounded-[var(--radius-input)] border border-card-border bg-card px-4 py-2.5 text-sm text-text shadow-card outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20';

export function AuditLogFilters({
  value,
  nameValue,
  exporting,
  showExport = true,
  searchPlaceholder,
  onQueryChange,
  onNameChange,
  onExport,
}: Props) {
  const [range, setRange] = useState<DateRangeValue>(ALL_TIME);
  const [action, setAction] = useState<AuditAction | undefined>(value.action);
  const [scope, setScope] = useState<LogScope | undefined>(value.scope);

  const applyQuery = (next: {
    range?: DateRangeValue;
    action?: AuditAction;
    scope?: LogScope;
  }) => {
    const usedRange = next.range ?? range;
    const usedAction = 'action' in next ? next.action : action;
    const usedScope = 'scope' in next ? next.scope : scope;

    onQueryChange({
      ...value,
      action: usedAction,
      scope: usedScope,
      ...resolveDateRange(usedRange),
    });
  };

  return (
    <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-[420px]">
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={nameValue}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={searchPlaceholder ?? t('audit.filter.userPlaceholder')}
          className={SEARCH_CLASS}
        />
        {nameValue && (
          <button
            type="button"
            onClick={() => onNameChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <DateRangeFilter
          value={range}
          onChange={(next) => {
            setRange(next);
            applyQuery({ range: next });
          }}
        />

        <select
          className={SELECT_CLASS}
          title={t('audit.filter.eventType')}
          value={action ?? ''}
          onChange={(e) => {
            const next = e.target.value === '' ? undefined : (Number(e.target.value) as AuditAction);
            setAction(next);
            applyQuery({ action: next });
          }}
        >
          <option value="">{t('audit.filter.allEvents')}</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{actionBadge(a).label}</option>
          ))}
        </select>

        <select
          className={SELECT_CLASS}
          title={t('audit.filter.userScope')}
          value={scope ?? ''}
          onChange={(e) => {
            const next = e.target.value === '' ? undefined : (Number(e.target.value) as LogScope);
            setScope(next);
            applyQuery({ scope: next });
          }}
        >
          <option value="">{t('audit.filter.all')}</option>
          {SCOPES.map((s) => (
            <option key={s} value={s}>{scopeBadge(s).label}</option>
          ))}
        </select>

        {showExport && (
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exporting ? t('audit.exporting') : t('audit.export')}
          </button>
        )}
      </div>
    </div>
  );
}
