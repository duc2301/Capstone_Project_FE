import { useState } from 'react';

import type { AuditLogQuery } from '@/entities/audit-log';
import { AuditAction, LogScope } from '@/entities/audit-log';
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

type Preset = 'all' | 'today' | '7d' | '30d' | '90d' | 'custom';
const PRESETS: { id: Preset; key: 'audit.range.all' | 'audit.range.today' | 'audit.range.7d' | 'audit.range.30d' | 'audit.range.90d' | 'audit.range.custom' }[] = [
  { id: '7d', key: 'audit.range.7d' },
  { id: '30d', key: 'audit.range.30d' },
  { id: '90d', key: 'audit.range.90d' },
  { id: 'today', key: 'audit.range.today' },
  { id: 'all', key: 'audit.range.all' },
  { id: 'custom', key: 'audit.range.custom' },
];

/* Preset -> khoảng [from, to] dạng yyyy-mm-dd cho query BE. */
function presetToRange(preset: Preset): { from?: string; to?: string } {
  if (preset === 'all' || preset === 'custom') return { from: undefined, to: undefined };
  const to = new Date();
  const from = new Date();
  if (preset === 'today') from.setHours(0, 0, 0, 0);
  else if (preset === '7d') from.setDate(from.getDate() - 7);
  else if (preset === '30d') from.setDate(from.getDate() - 30);
  else if (preset === '90d') from.setDate(from.getDate() - 90);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

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
  const [preset, setPreset] = useState<Preset>('7d');
  const [action, setAction] = useState<AuditAction | undefined>(value.action);
  const [scope, setScope] = useState<LogScope | undefined>(value.scope);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const applyQuery = (next: {
    preset?: Preset;
    action?: AuditAction;
    scope?: LogScope;
    from?: string;
    to?: string;
  }) => {
    const usedPreset = next.preset ?? preset;
    const usedAction = 'action' in next ? next.action : action;
    const usedScope = 'scope' in next ? next.scope : scope;

    const range = usedPreset === 'custom'
      ? {
          from: ('from' in next ? next.from : customFrom) || undefined,
          to: ('to' in next ? next.to : customTo) || undefined,
        }
      : presetToRange(usedPreset);

    onQueryChange({ ...value, action: usedAction, scope: usedScope, ...range });
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
        <select
          className={SELECT_CLASS}
          title={t('audit.filter.dateRange')}
          value={preset}
          onChange={(e) => {
            const next = e.target.value as Preset;
            setPreset(next);
            applyQuery({ preset: next });
          }}
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{t(p.key)}</option>
          ))}
        </select>

        {preset === 'custom' && (
          <>
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              title={t('audit.range.from')}
              onChange={(e) => {
                setCustomFrom(e.target.value);
                applyQuery({ from: e.target.value });
              }}
              className={SELECT_CLASS}
            />
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              title={t('audit.range.to')}
              onChange={(e) => {
                setCustomTo(e.target.value);
                applyQuery({ to: e.target.value });
              }}
              className={SELECT_CLASS}
            />
          </>
        )}

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
