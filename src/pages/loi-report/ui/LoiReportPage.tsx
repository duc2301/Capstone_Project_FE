import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { fileItemApi } from '@/entities/file-item';
import type { LoiCheckResult, LoiStage } from '@/entities/loi-check';
import { LoiCheckStatus, LoiStage as Stage } from '@/entities/loi-check';
import { LoiSectionList, useLoiCheck } from '@/features/loi-check';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 border-b border-card-border px-5 py-3 last:border-0">
      <span className="w-44 shrink-0 text-sm font-semibold text-text">{label}</span>
      <span className="min-w-0 flex-1 break-words text-sm text-text-secondary">{value}</span>
    </div>
  );
}

const STAGE_LABEL_KEY: Record<LoiStage, TranslationKey> = {
  [Stage.SchematicDesign]: 'loi.stage.2',
  [Stage.DetailedDesign]: 'loi.stage.3',
  [Stage.ConstructionDrawing]: 'loi.stage.4',
  [Stage.Construction]: 'loi.stage.5',
};

function stageLabel(stage: number): string {
  const key = STAGE_LABEL_KEY[stage as LoiStage];
  return key ? t(key) : String(stage);
}

function useFileName(fileItemId: string | undefined): string | null {
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (!fileItemId) return;

    let cancelled = false;
    void (async () => {
      try {
        const { data } = await fileItemApi.getView(fileItemId);
        if (!cancelled && data.isSuccess) setFileName(data.result?.fileName ?? null);
      } catch {
        if (!cancelled) setFileName(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileItemId]);

  return fileName;
}

function MetaTable({ result, fileName }: { result: LoiCheckResult; fileName: string | null }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-card-border bg-card shadow-card">
      {fileName && <MetaRow label={t('loi.report.fileName')} value={fileName} />}
      <MetaRow label={t('loi.checkedAt')} value={formatDateTime(result.checkedAt)} />
      <MetaRow label={t('loi.schema')} value={result.schemaName ?? '-'} />
      <MetaRow label={t('loi.stage.label')} value={stageLabel(result.targetStage)} />
      <MetaRow label={t('loi.stats.total')} value={String(result.totalElements)} />
      <MetaRow label={t('loi.stats.conformant')} value={String(result.conformantElements)} />
      <MetaRow label={t('loi.stats.unknownType')} value={String(result.elementsWithUnknownType)} />
    </div>
  );
}

function NotReady({ result }: { result: LoiCheckResult | null }) {
  if (result === null || result.status === LoiCheckStatus.None) {
    return <p className="text-sm text-text-muted">{t('loi.report.notReady')}</p>;
  }

  if (result.status === LoiCheckStatus.Pending || result.status === LoiCheckStatus.Processing) {
    return <p className="text-sm text-text-muted">{t('loi.running.desc')}</p>;
  }

  return (
    <div>
      <p className="text-sm font-semibold text-danger">{t('loi.failed.title')}</p>
      {result.error && <p className="mt-1 break-words text-xs text-text-muted">{result.error}</p>}
    </div>
  );
}

export function LoiReportPage() {
  const { projectId, fileId } = useParams<{ projectId: string; fileId: string }>();
  const { result, loading, error } = useLoiCheck(fileId, projectId);
  const fileName = useFileName(fileId);

  const backHref = projectId && fileId ? `/projects/${projectId}/files/${fileId}/view` : '/';
  const ready = result !== null && result.status === LoiCheckStatus.Done;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="heading-page">{t('loi.report.title')}</h1>
        <Link
          to={backHref}
          className="whitespace-nowrap rounded-full border border-card-border px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-content-bg"
        >
          {t('loi.report.back')}
        </Link>
      </div>

      {loading && <p className="text-sm text-text-muted">{t('loi.loading')}</p>}
      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      {!loading && !error && !ready && <NotReady result={result} />}

      {ready && (
        <div className="space-y-6">
          <MetaTable result={result} fileName={fileName} />
          {/* Kết quả kiểm từ TRƯỚC khi có báo cáo phân lớp thì không có dữ liệu để dựng. */}
          {result.sections.length === 0 ? (
            <p className="text-sm text-text-muted">{t('loi.report.stale')}</p>
          ) : (
            <LoiSectionList sections={result.sections} />
          )}
        </div>
      )}
    </div>
  );
}
