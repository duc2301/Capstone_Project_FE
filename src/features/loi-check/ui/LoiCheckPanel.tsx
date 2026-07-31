import { useMemo } from 'react';

import type { LoiCheckResult, LoiMissingField, LoiParamGroup, LoiVerdict } from '@/entities/loi-check';
import { LoiParamGroup as Group, LoiCheckStatus, LoiVerdict as Verdict } from '@/entities/loi-check';
import { t } from '@/shared/lib/i18n';

import { useLoiCheck } from '../model/useLoiCheck';

function Spinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

function groupLabel(g: LoiParamGroup): string {
  switch (g) {
    case Group.DinhDanh: return t('loi.group.dinhDanh');
    case Group.DinhVi: return t('loi.group.dinhVi');
    case Group.HinhHoc: return t('loi.group.hinhHoc');
    case Group.QuyCach: return t('loi.group.quyCach');
    case Group.VatLieu: return t('loi.group.vatLieu');
    default: return '';
  }
}

function verdictMeta(v: LoiVerdict): { label: string; className: string } {
  switch (v) {
    case Verdict.Conformant:
      return { label: t('loi.verdict.conformant'), className: 'border-success/20 bg-success-light text-success' };
    case Verdict.Warning:
      return { label: t('loi.verdict.warning'), className: 'border-warning/20 bg-warning-light text-warning' };
    default:
      return { label: t('loi.verdict.unknown'), className: 'border-card-border bg-content-bg text-text-secondary' };
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function Stat({ label, value, tone = 'text-text' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-card-border bg-white/60 px-3 py-3 text-center">
      <p className={`font-display text-xl font-bold ${tone}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
    </div>
  );
}

function RecheckButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-card-border px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? t('loi.rechecking') : t('loi.recheck')}
    </button>
  );
}

function ResultBody({ result, onRecheck, recomputing }: { result: LoiCheckResult; onRecheck: () => void; recomputing: boolean }) {
  const meta = verdictMeta(result.verdict);
  const grouped = useMemo(() => {
    const map = new Map<LoiParamGroup, LoiMissingField[]>();
    for (const m of result.missing) {
      const arr = map.get(m.group) ?? [];
      arr.push(m);
      map.set(m.group, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [result.missing]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-text">{t('loi.title')}</h2>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
      </div>
      <p className="mt-1 text-sm text-text-muted">{t('loi.subtitle')}</p>

      <div className="mt-5 rounded-2xl border border-card-border bg-white/60 p-4">
        <div className="flex items-end justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t('loi.coverage')}</span>
          <span className="font-display text-2xl font-bold text-primary">{result.coveragePercent}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-content-bg">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, result.coveragePercent))}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <Stat label={t('loi.stats.total')} value={result.totalElements} />
        <Stat label={t('loi.stats.conformant')} value={result.conformantElements} tone="text-success" />
        <Stat label={t('loi.stats.unknownType')} value={result.elementsWithUnknownType} tone="text-warning" />
      </div>

      {result.elementsWithUnknownType > 0 && (
        <p className="mt-3 text-xs leading-relaxed text-text-muted">{t('loi.unknownTypeNote')}</p>
      )}

      <div className="mt-6 border-t border-card-border/70 pt-5">
        <h3 className="text-sm font-bold text-text">{t('loi.missing.title')}</h3>
        {grouped.length === 0 ? (
          <p className="mt-3 text-sm text-success">{t('loi.missing.none')}</p>
        ) : (
          <div className="mt-3 space-y-4">
            {grouped.map(([group, items]) => (
              <div key={group}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{groupLabel(group)}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {items.map((m) => (
                    <li key={m.fieldName} className="flex items-center justify-between gap-3 rounded-lg border border-card-border/70 bg-white/60 px-3 py-2">
                      <span className="min-w-0 truncate text-sm font-medium text-text">{m.fieldName}</span>
                      <span className="shrink-0 rounded-full bg-danger-light px-2 py-0.5 text-[11px] font-bold text-danger">
                        {m.missingCount} {t('loi.missing.elementsSuffix')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 space-y-1 border-t border-card-border/70 pt-4 text-xs text-text-muted">
        {result.schemaName && <p>{t('loi.schema')}: {result.schemaName}</p>}
        <p>{t('loi.checkedAt')}: {formatDateTime(result.checkedAt)}</p>
      </div>

      <RecheckButton onClick={onRecheck} busy={recomputing} />
    </div>
  );
}

export function LoiCheckPanel({ fileItemId }: { fileItemId: string }) {
  const { result, loading, error, recompute, recomputing } = useLoiCheck(fileItemId);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Spinner />
        <p className="text-sm text-text-muted">{t('loi.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-medium text-danger">{error}</p>
        <RecheckButton onClick={recompute} busy={recomputing} />
      </div>
    );
  }

  if (!result || result.status === LoiCheckStatus.None) {
    return (
      <div className="py-10 text-center">
        <h3 className="font-display text-base font-semibold text-text">{t('loi.empty.title')}</h3>
        <p className="mt-1 text-sm text-text-muted">{t('loi.empty.desc')}</p>
        <RecheckButton onClick={recompute} busy={recomputing} />
      </div>
    );
  }

  if (result.status === LoiCheckStatus.Pending || result.status === LoiCheckStatus.Processing) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Spinner />
        <h3 className="font-display text-base font-semibold text-text">{t('loi.running.title')}</h3>
        <p className="max-w-xs text-sm text-text-muted">{t('loi.running.desc')}</p>
      </div>
    );
  }

  if (result.status === LoiCheckStatus.Failed) {
    return (
      <div className="py-8 text-center">
        <h3 className="font-display text-base font-semibold text-danger">{t('loi.failed.title')}</h3>
        {result.error && <p className="mt-2 break-words text-xs text-text-muted">{result.error}</p>}
        <RecheckButton onClick={recompute} busy={recomputing} />
      </div>
    );
  }

  return <ResultBody result={result} onRecheck={recompute} recomputing={recomputing} />;
}
