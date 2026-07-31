import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import type {
  LoiCheckResult, LoiMissingField, LoiParamGroup, LoiSection, LoiUncoveredComponent,
  LoiUnmappedParam, LoiVerdict,
} from '@/entities/loi-check';
import {
  LOI_STAGE_OPTIONS,
  LoiParamGroup as Group,
  LoiCheckStatus,
  LoiStage,
  LoiVerdict as Verdict,
} from '@/entities/loi-check';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

import { useLoiCheck } from '../model/useLoiCheck';
import { LOI_SECTION_ORDER, sectionLabel, severityLabel, severityTone } from './loiReportMeta';

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

const STAGE_LABEL_KEY: Record<LoiStage, TranslationKey> = {
  [LoiStage.SchematicDesign]: 'loi.stage.2',
  [LoiStage.DetailedDesign]: 'loi.stage.3',
  [LoiStage.ConstructionDrawing]: 'loi.stage.4',
  [LoiStage.Construction]: 'loi.stage.5',
};

function stageLabel(stage: LoiStage | number): string {
  const key = STAGE_LABEL_KEY[stage as LoiStage];
  return key ? t(key) : String(stage);
}

function verdictMeta(v: LoiVerdict): { label: string; className: string } {
  switch (v) {
    case Verdict.Conformant:
      return { label: t('loi.verdict.conformant'), className: 'border-success/20 bg-success-light text-success' };
    case Verdict.Warning:
      return { label: t('loi.verdict.warning'), className: 'border-warning/20 bg-warning-light text-warning' };
    case Verdict.Critical:
      return { label: t('loi.verdict.critical'), className: 'border-danger/20 bg-danger-light text-danger' };
    default:
      return { label: t('loi.verdict.unknown'), className: 'border-card-border bg-content-bg text-text-secondary' };
  }
}

const NOT_AVAILABLE = '—';

function isNotEvaluated(result: LoiCheckResult): boolean {
  return result.verdict === Verdict.Unknown || result.verdict === Verdict.None;
}

function notEvaluatedReason(result: LoiCheckResult): string {
  if (result.totalElements === 0) return t('loi.notEvaluated.noElements');
  if (result.elementsWithUnknownType > 0) return t('loi.notEvaluated.noClassification');
  if (result.elementsNotCoveredByStandard > 0) return t('loi.notEvaluated.allUncovered');
  return t('loi.notEvaluated.noRules');
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

interface CheckControlsProps {
  stage: LoiStage;
  onStageChange: (stage: LoiStage) => void;
  onCheck: () => void;
  busy: boolean;
  label: string;
}

function CheckControls({ stage, onStageChange, onCheck, busy, label }: CheckControlsProps) {
  return (
    <div className="mt-5 space-y-2 text-left">
      <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted" htmlFor="loi-stage">
        {t('loi.stage.label')}
      </label>
      <select
        id="loi-stage"
        value={stage}
        onChange={(e) => onStageChange(Number(e.target.value) as LoiStage)}
        disabled={busy}
        className="w-full rounded-xl border border-card-border bg-white/60 px-3 py-2.5 text-sm font-medium text-text disabled:cursor-not-allowed disabled:opacity-60"
      >
        {LOI_STAGE_OPTIONS.map((option) => (
          <option key={option} value={option}>{stageLabel(option)}</option>
        ))}
      </select>
      <p className="text-xs leading-relaxed text-text-muted">{t('loi.stage.hint')}</p>
      <button
        type="button"
        onClick={onCheck}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-card-border px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? t('loi.rechecking') : label}
      </button>
    </div>
  );
}

function SectionSummary({ sections, reportHref }: { sections: LoiSection[]; reportHref: string | null }) {
  const ordered = useMemo(() => {
    const byId = new Map(sections.map((s) => [s.section, s]));
    return LOI_SECTION_ORDER.map((id) => byId.get(id)).filter((s): s is LoiSection => s !== undefined);
  }, [sections]);

  if (ordered.length === 0) return null;

  return (
    <div className="mt-5 space-y-1.5">
      {ordered.map((section) => {
        const tone = severityTone(section.severity);
        return (
          <div key={section.section} className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
            <span className="min-w-0 flex-1 truncate text-sm text-text">{sectionLabel(section.section)}</span>
            <span className={`shrink-0 text-[11px] font-bold uppercase tracking-wide ${tone.text}`}>
              {severityLabel(section.severity)}
            </span>
          </div>
        );
      })}

      {reportHref && (
        <Link
          to={reportHref}
          className="mt-2 flex items-center justify-center rounded-xl border border-card-border px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-content-bg"
        >
          {t('loi.report.open')}
        </Link>
      )}
    </div>
  );
}

function NotCoveredSection({ items }: { items: LoiUncoveredComponent[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-card-border/70 bg-content-bg/60 p-4">
      <h3 className="text-sm font-bold text-text">{t('loi.notCovered.title')}</h3>
      <p className="mt-1 text-xs leading-relaxed text-text-muted">{t('loi.notCovered.desc')}</p>
      <ul className="mt-2.5 space-y-1.5">
        {items.map((item) => (
          <li key={item.componentCode} className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-text">{item.componentName}</span>
              <span className="block font-mono text-[11px] text-text-muted">{item.componentCode}</span>
            </span>
            <span className="shrink-0 text-[11px] font-semibold text-text-muted">
              {item.elementCount} {t('loi.notCovered.elementsSuffix')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface MappingSectionProps {
  items: LoiUnmappedParam[];
  onConfirm: (param: LoiUnmappedParam) => void;
  busyParam: string | null;
  error: string | null;
}

function MappingSection({ items, onConfirm, busyParam, error }: MappingSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-6 border-t border-card-border/70 pt-5">
      <h3 className="text-sm font-bold text-text">{t('loi.mapping.title')}</h3>
      <p className="mt-1 text-xs leading-relaxed text-text-muted">{t('loi.mapping.desc')}</p>
      {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}

      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const busy = busyParam === item.paramNameInModel;
          return (
            <li
              key={item.paramNameInModel}
              className="rounded-xl border border-card-border/70 bg-white/60 px-3 py-2.5"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-medium text-text">{item.paramNameInModel}</span>
                <span className="shrink-0 text-xs text-text-muted">{t('loi.mapping.arrow')}</span>
                <span className="min-w-0 flex-1 truncate font-semibold text-primary">{item.suggestedParamName}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[11px] text-text-muted">
                  {item.elementCount} {t('loi.mapping.elementsSuffix')} · {t('loi.mapping.confidence')}{' '}
                  {Math.round(item.confidence * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => onConfirm(item)}
                  disabled={busy || busyParam !== null}
                  className="shrink-0 rounded-lg border border-card-border px-3 py-1 text-xs font-semibold text-text transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? t('loi.mapping.confirming') : t('loi.mapping.confirm')}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface ResultBodyProps {
  result: LoiCheckResult;
  controls: React.ReactNode;
  mapping: React.ReactNode;
  reportHref: string | null;
}

function ResultBody({ result, controls, mapping, reportHref }: ResultBodyProps) {
  const meta = verdictMeta(result.verdict);
  const notEvaluated = isNotEvaluated(result);
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
          <span className={`font-display text-2xl font-bold ${notEvaluated ? 'text-text-muted' : 'text-primary'}`}>
            {notEvaluated ? NOT_AVAILABLE : `${result.coveragePercent}%`}
          </span>
        </div>
        {notEvaluated ? (
          <p className="mt-2 text-xs leading-relaxed text-text-muted">{notEvaluatedReason(result)}</p>
        ) : (
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-content-bg">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, result.coveragePercent))}%` }} />
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <Stat label={t('loi.stats.total')} value={result.totalElements} />
        <Stat label={t('loi.stats.conformant')} value={result.conformantElements} tone="text-success" />
        <Stat label={t('loi.stats.unknownType')} value={result.elementsWithUnknownType} tone="text-warning" />
      </div>

      {/* Không đo được thì lý do đã nói ở ô tỷ lệ, nhắc lại chỉ thành thừa. */}
      {!notEvaluated && result.elementsWithUnknownType > 0 && (
        <p className="mt-3 text-xs leading-relaxed text-text-muted">{t('loi.unknownTypeNote')}</p>
      )}

      <SectionSummary sections={result.sections} reportHref={reportHref} />

      <NotCoveredSection items={result.notCovered} />

      <div className="mt-6 border-t border-card-border/70 pt-5">
        <h3 className="text-sm font-bold text-text">{t('loi.missing.title')}</h3>
        {grouped.length === 0 ? (
          <p className={`mt-3 text-sm ${notEvaluated ? 'text-text-muted' : 'text-success'}`}>
            {notEvaluated ? t('loi.missing.notEvaluated') : t('loi.missing.none')}
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {grouped.map(([group, items]) => (
              <div key={group}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">{groupLabel(group)}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {items.map((m) => (
                    <li
                      key={`${m.variant ?? ''}|${m.fieldName}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-card-border/70 bg-white/60 px-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-text">{m.fieldName}</span>
                        {m.variant && (
                          <span className="block truncate text-[11px] text-text-muted">{m.variant}</span>
                        )}
                      </span>
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

      {mapping}

      <div className="mt-5 space-y-1 border-t border-card-border/70 pt-4 text-xs text-text-muted">
        <p>{t('loi.stage.label')}: {stageLabel(result.targetStage)}</p>
        {result.schemaName && <p>{t('loi.schema')}: {result.schemaName}</p>}
        <p>{t('loi.checkedAt')}: {formatDateTime(result.checkedAt)}</p>
      </div>

      {controls}
    </div>
  );
}

export function LoiCheckPanel({ fileItemId, projectId }: { fileItemId: string; projectId?: string }) {
  const {
    result, stage, setStage, loading, error, recompute, recomputing, isRunning,
    canMap, confirmMapping, mappingParam, mappingError,
  } = useLoiCheck(fileItemId, projectId);

  const hasResult = result !== null && result.status !== LoiCheckStatus.None;
  const reportHref = projectId ? `/projects/${projectId}/files/${fileItemId}/loi-report` : null;
  const mapping = canMap && result ? (
    <MappingSection
      items={result.unmapped}
      onConfirm={confirmMapping}
      busyParam={mappingParam}
      error={mappingError}
    />
  ) : null;
  const controls = (
    <CheckControls
      stage={stage}
      onStageChange={setStage}
      onCheck={recompute}
      busy={recomputing || isRunning}
      label={hasResult ? t('loi.recheck') : t('loi.checkNow')}
    />
  );

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
        {controls}
      </div>
    );
  }

  if (!hasResult) {
    return (
      <div className="py-10 text-center">
        <h3 className="font-display text-base font-semibold text-text">{t('loi.empty.title')}</h3>
        <p className="mt-1 text-sm text-text-muted">{t('loi.empty.desc2')}</p>
        {controls}
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
        {controls}
      </div>
    );
  }

  return <ResultBody result={result} controls={controls} mapping={mapping} reportHref={reportHref} />;
}
