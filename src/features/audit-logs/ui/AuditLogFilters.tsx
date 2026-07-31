import { useState } from 'react';

import type { AuditLogQuery } from '@/entities/audit-log';
import { AuditAction, LogScope } from '@/entities/audit-log';
import { t } from '@/shared/lib/i18n';
import { actionBadge, scopeBadge } from '../model/auditFormat';

interface Props {
  value: AuditLogQuery;
  /* Ô "Người dùng" lọc client-side theo tên (BE chưa có tìm theo tên/email). */
  nameValue: string;
  onApply: (next: AuditLogQuery, name: string) => void;
}

const SCOPES = [LogScope.System, LogScope.Project, LogScope.Group];
const ACTIONS = Object.values(AuditAction);

type Preset = 'all' | 'today' | '7d' | '30d' | '90d';
const PRESETS: { id: Preset; key: 'audit.range.all' | 'audit.range.today' | 'audit.range.7d' | 'audit.range.30d' | 'audit.range.90d' }[] = [
  { id: '7d', key: 'audit.range.7d' },
  { id: '30d', key: 'audit.range.30d' },
  { id: '90d', key: 'audit.range.90d' },
  { id: 'today', key: 'audit.range.today' },
  { id: 'all', key: 'audit.range.all' },
];

/* Preset -> khoảng [from, to] dạng yyyy-mm-dd cho query BE. */
function presetToRange(preset: Preset): { from?: string; to?: string } {
  if (preset === 'all') return { from: undefined, to: undefined };
  const to = new Date();
  const from = new Date();
  if (preset === 'today') from.setHours(0, 0, 0, 0);
  else if (preset === '7d') from.setDate(from.getDate() - 7);
  else if (preset === '30d') from.setDate(from.getDate() - 30);
  else if (preset === '90d') from.setDate(from.getDate() - 90);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

const controlClass =
  'h-11 w-full rounded-xl border border-input-border bg-input-bg pl-9 pr-3 text-sm text-text outline-none transition-colors focus:border-primary';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-text-muted">{children}</span>;
}

function LeadingIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
      {children}
    </span>
  );
}

export function AuditLogFilters({ value, nameValue, onApply }: Props) {
  const [preset, setPreset] = useState<Preset>('7d');
  const [action, setAction] = useState<AuditAction | undefined>(value.action);
  const [scope, setScope] = useState<LogScope | undefined>(value.scope);
  const [name, setName] = useState(nameValue);

  const apply = () => {
    const { from, to } = presetToRange(preset);
    onApply({ ...value, action, scope, from, to }, name);
  };

  return (
    <div className="rounded-2xl border border-card-border bg-card p-5 shadow-card">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
        {/* Khoảng thời gian */}
        <label className="block">
          <FieldLabel>{t('audit.filter.dateRange')}</FieldLabel>
          <div className="relative">
            <LeadingIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </LeadingIcon>
            <select className={controlClass} value={preset} onChange={(e) => setPreset(e.target.value as Preset)}>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{t(p.key)}</option>
              ))}
            </select>
          </div>
        </label>

        {/* Loại thao tác */}
        <label className="block">
          <FieldLabel>{t('audit.filter.eventType')}</FieldLabel>
          <div className="relative">
            <LeadingIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </LeadingIcon>
            <select
              className={controlClass}
              value={action ?? ''}
              onChange={(e) => setAction(e.target.value === '' ? undefined : (Number(e.target.value) as AuditAction))}
            >
              <option value="">{t('audit.filter.allEvents')}</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>{actionBadge(a).label}</option>
              ))}
            </select>
          </div>
        </label>

        {/* Người dùng (lọc client-side theo tên) */}
        <label className="block">
          <FieldLabel>{t('audit.filter.user')}</FieldLabel>
          <div className="relative">
            <LeadingIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </LeadingIcon>
            <input
              type="text"
              className={controlClass}
              placeholder={t('audit.filter.userPlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') apply(); }}
            />
          </div>
        </label>

        {/* Phạm vi người dùng (map sang scope) */}
        <label className="block">
          <FieldLabel>{t('audit.filter.userScope')}</FieldLabel>
          <div className="relative">
            <LeadingIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </LeadingIcon>
            <select
              className={controlClass}
              value={scope ?? ''}
              onChange={(e) => setScope(e.target.value === '' ? undefined : (Number(e.target.value) as LogScope))}
            >
              <option value="">{t('audit.filter.all')}</option>
              {SCOPES.map((s) => (
                <option key={s} value={s}>{scopeBadge(s).label}</option>
              ))}
            </select>
          </div>
        </label>

        <button
          type="button"
          onClick={apply}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary-ghost px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {t('audit.filter.applyFull')}
        </button>
      </div>
    </div>
  );
}
