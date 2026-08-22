import { useRef, useState } from 'react';

import type { ProjectImportPreview } from '@/entities/project';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

import { useProjectImport } from '../model/useProjectImport';

const cardClass =
  'flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-card-border bg-card px-5 py-7 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary-ghost disabled:cursor-not-allowed disabled:opacity-50';

function ManualIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function ExcelIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="19" />
      <line x1="15" y1="13" x2="9" y2="19" />
    </svg>
  );
}

function BepIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3" />
      <rect x="4" y="6" width="16" height="12" rx="3" />
      <circle cx="9" cy="12" r="1.2" />
      <circle cx="15" cy="12" r="1.2" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

interface MethodCardProps {
  icon: React.ReactNode;
  titleKey: TranslationKey;
  hintKey: TranslationKey;
  disabled: boolean;
  onClick: () => void;
}

function MethodCard({ icon, titleKey, hintKey, disabled, onClick }: MethodCardProps) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cardClass}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="heading-card">{t(titleKey)}</span>
      <span className="field-hint">{t(hintKey)}</span>
    </button>
  );
}

export interface CreateProjectMethodPickerProps {
  onManual: () => void;
  onImported: (preview: ProjectImportPreview) => void;
  onBepSelected: (file: File) => void;
  bepBusy?: boolean;
}

export function CreateProjectMethodPicker({ onManual, onImported, onBepSelected, bepBusy = false }: CreateProjectMethodPickerProps) {
  const { downloading, parsing, downloadTemplate, parseFile } = useProjectImport();
  const excelInputRef = useRef<HTMLInputElement>(null);
  const bepInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = downloading || parsing;

  const handleDownload = async () => {
    setError(null);
    try {
      await downloadTemplate();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects.import.templateError'));
    }
  };

  const handleExcel = async (file: File) => {
    setError(null);
    try {
      onImported(await parseFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects.import.parseError'));
    }
  };

  return (
    <div className="space-y-5">
      <input
        ref={excelInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void handleExcel(file);
        }}
      />
      <input
        ref={bepInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onBepSelected(file);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MethodCard
          icon={<ManualIcon />}
          titleKey="projects.method.manual"
          hintKey="projects.method.manualHint"
          disabled={busy}
          onClick={onManual}
        />
        <MethodCard
          icon={parsing ? <SpinnerIcon /> : <ExcelIcon />}
          titleKey={parsing ? 'projects.import.parsing' : 'projects.method.excel'}
          hintKey="projects.method.excelHint"
          disabled={busy}
          onClick={() => excelInputRef.current?.click()}
        />
        <MethodCard
          icon={<BepIcon />}
          titleKey={bepBusy ? 'projects.bep.parsing' : 'projects.method.bep'}
          hintKey="projects.method.bepHint"
          disabled={busy || bepBusy}
          onClick={() => bepInputRef.current?.click()}
        />
      </div>

      {error && (
        <div className="rounded-[var(--radius-input)] border border-danger/30 bg-danger-light px-4 py-3">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border/60 pt-4">
        <p className="field-hint max-w-md">{t('projects.method.templateHint')}</p>
        <button type="button" onClick={() => void handleDownload()} disabled={busy} className="btn-modal-ghost disabled:cursor-not-allowed disabled:opacity-50">
          {downloading ? t('projects.import.downloading') : t('projects.import.downloadTemplate')}
        </button>
      </div>
    </div>
  );
}
