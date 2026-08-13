import { useMemo, useState } from 'react';

import type { LoiImportComponentDiff, LoiRuleSet } from '@/entities/loi-check';
import { LoiImportMode, LoiImportStatus } from '@/entities/loi-check';
import { ConfirmDialog, Modal } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { useLoiRuleImport } from '../model/useLoiRuleImport';
import { disciplineLabel } from './loiRuleMeta';

const STATUS_TONE: Record<number, string> = {
  0: 'bg-success-light text-success',
  1: 'bg-accent-amber-tint text-accent-amber',
  2: 'bg-content-bg text-text-muted',
  3: 'bg-danger-light text-danger',
};

function statusLabel(status: LoiImportStatus): string {
  switch (status) {
    case LoiImportStatus.Added: return t('loiRule.import.statusAdded');
    case LoiImportStatus.Updated: return t('loiRule.import.statusUpdated');
    case LoiImportStatus.Unchanged: return t('loiRule.import.statusUnchanged');
    default: return t('loiRule.import.statusMissing');
  }
}

interface LoiImportModalProps {
  ruleSet: LoiRuleSet | null;
  onClose: () => void;
  onImported: (ruleSet: LoiRuleSet) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export function LoiImportModal({ ruleSet, onClose, onImported, showToast }: LoiImportModalProps) {
  const { preview, parsing, committing, downloading, downloadTemplate, parseFile, commit } =
    useLoiRuleImport();

  const [mode, setMode] = useState<LoiImportMode>(LoiImportMode.Merge);
  const [newName, setNewName] = useState('');
  const [deleteMissing, setDeleteMissing] = useState(false);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<LoiImportStatus | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const importable = useMemo(
    () => preview?.diffs.filter((d) => d.status !== LoiImportStatus.MissingInFile) ?? [],
    [preview],
  );

  const visibleDiffs = useMemo(
    () =>
      (preview?.diffs ?? []).filter((d) => statusFilter === null || d.status === statusFilter),
    [preview, statusFilter],
  );

  const selectedCodes = importable.filter((d) => !excluded.has(d.code)).map((d) => d.code);

  const toggle = (code: string) =>
    setExcluded((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      await parseFile(file, ruleSet?.id ?? null);
      setExcluded(new Set());
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('loiRule.import.parseError'), 'error');
    }
  };

  const handleDownloadTemplate = async () => {
    if (!ruleSet) return;
    try {
      await downloadTemplate(ruleSet.id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('loiRule.import.templateError'), 'error');
    }
  };

  const runCommit = async () => {
    if (!preview) return;
    setConfirmOpen(false);
    try {
      const saved = await commit({
        mode,
        targetRuleSetId: mode === LoiImportMode.CreateNew ? null : ruleSet?.id ?? null,
        newRuleSetName: mode === LoiImportMode.CreateNew ? newName.trim() : null,
        selectedComponentCodes: selectedCodes,
        deleteMissing: mode === LoiImportMode.Merge && deleteMissing,
        parameters: preview.parameters,
        components: preview.components,
        rows: preview.rows,
      });
      showToast(t('loiRule.import.committed'));
      onImported(saved);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('loiRule.import.commitError'), 'error');
    }
  };

  const canCommit =
    preview !== null &&
    selectedCodes.length > 0 &&
    !committing &&
    (mode !== LoiImportMode.CreateNew || newName.trim().length > 0);

  const statusChip = (status: LoiImportStatus | null, label: string, count: number) => (
    <button
      key={label}
      type="button"
      onClick={() => setStatusFilter(status)}
      className={`rounded-[var(--radius-button)] px-3 py-1.5 text-xs font-semibold transition-colors ${
        statusFilter === status ? 'bg-primary text-white' : 'bg-content-bg text-text-secondary hover:bg-card'
      }`}
    >
      {label} <span className="font-bold">{count}</span>
    </button>
  );

  return (
    <Modal title={t('loiRule.import.title')} onClose={onClose} maxWidth="max-w-5xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-card-border bg-content-bg/50 p-3">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={!ruleSet || downloading}
            className="btn-modal-ghost disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? t('loiRule.import.downloading') : t('loiRule.import.downloadTemplate')}
          </button>
          <label className="btn-modal-primary cursor-pointer">
            {parsing ? t('loiRule.import.parsing') : t('loiRule.import.pickFile')}
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              disabled={parsing}
              onChange={(e) => {
                void handleFile(e.target.files?.[0] ?? null);
                e.target.value = '';
              }}
            />
          </label>
          <p className="field-hint flex-1">{t('loiRule.import.fileHint')}</p>
        </div>

        {preview && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {statusChip(null, t('loiRule.import.filterAll'), preview.diffs.length)}
              {statusChip(LoiImportStatus.Added, t('loiRule.import.statusAdded'), preview.addedCount)}
              {statusChip(LoiImportStatus.Updated, t('loiRule.import.statusUpdated'), preview.updatedCount)}
              {statusChip(LoiImportStatus.Unchanged, t('loiRule.import.statusUnchanged'), preview.unchangedCount)}
              {statusChip(LoiImportStatus.MissingInFile, t('loiRule.import.statusMissing'), preview.missingCount)}
              <span className="field-hint ml-auto">
                {preview.parameters.length} {t('loiRule.import.paramSuffix')} ·{' '}
                {preview.totalCellCount} {t('loiRule.import.cellSuffix')}
                {preview.taxonomyOnlyCount > 0 &&
                  ` · ${preview.taxonomyOnlyCount} ${t('loiRule.import.taxonomyOnlySuffix')}`}
              </span>
            </div>

            {preview.warnings.length > 0 && (
              <details className="rounded-[var(--radius-card)] border border-warning/30 bg-accent-amber-tint/40 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-text-secondary">
                  {t('loiRule.import.warnings')} ({preview.warnings.length})
                </summary>
                <ul className="admin-scrollbar mt-2 max-h-40 space-y-1 overflow-y-auto">
                  {preview.warnings.map((warning, index) => (
                    <li key={index} className="field-hint">{warning}</li>
                  ))}
                </ul>
              </details>
            )}

            <div className="admin-scrollbar max-h-72 overflow-y-auto rounded-[var(--radius-card)] border border-card-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-content-bg">
                  <tr className="text-left text-2xs font-bold uppercase tracking-wider text-text-secondary">
                    <th className="px-3 py-2 w-10" />
                    <th className="px-3 py-2">{t('loiRule.import.columnComponent')}</th>
                    <th className="px-3 py-2 w-40">{t('loiRule.parameter.columnDiscipline')}</th>
                    <th className="px-3 py-2 w-32">{t('loiRule.import.columnStatus')}</th>
                    <th className="px-3 py-2 w-36 text-right">{t('loiRule.import.columnCells')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDiffs.map((diff: LoiImportComponentDiff) => {
                    const missing = diff.status === LoiImportStatus.MissingInFile;
                    return (
                      <tr key={`${diff.status}-${diff.code}`} className="border-t border-card-border/60">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            disabled={missing}
                            checked={!missing && !excluded.has(diff.code)}
                            onChange={() => toggle(diff.code)}
                            className="h-4 w-4 rounded border-input-border accent-primary disabled:opacity-40"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <span className="block text-sm font-semibold text-text">{diff.name}</span>
                          <span className="block font-mono text-2xs text-text-muted">{diff.code}</span>
                        </td>
                        <td className="px-3 py-2 text-xs text-text-secondary">
                          {disciplineLabel(diff.discipline)}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-[var(--radius-badge)] px-2 py-0.5 text-2xs font-bold ${STATUS_TONE[diff.status]}`}>
                            {statusLabel(diff.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-xs text-text-secondary">
                          {missing
                            ? `${diff.currentRequirementCount} → 0`
                            : `${diff.currentRequirementCount} → ${diff.requirementCount}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 rounded-[var(--radius-card)] border border-card-border p-3">
              <p className="field-label">{t('loiRule.import.modeLabel')}</p>
              {[
                { value: LoiImportMode.Merge, label: t('loiRule.import.modeMerge'), hint: t('loiRule.import.modeMergeHint') },
                { value: LoiImportMode.ReplaceAll, label: t('loiRule.import.modeReplace'), hint: t('loiRule.import.modeReplaceHint') },
                { value: LoiImportMode.CreateNew, label: t('loiRule.import.modeCreate'), hint: t('loiRule.import.modeCreateHint') },
              ].map((option) => (
                <label key={option.value} className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="radio"
                    name="loi-import-mode"
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text">{option.label}</span>
                    <span className="field-hint block">{option.hint}</span>
                  </span>
                </label>
              ))}

              {mode === LoiImportMode.CreateNew && (
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('loiRule.ruleSet.namePlaceholder')}
                  className="field-input w-full"
                />
              )}

              {mode === LoiImportMode.Merge && preview.missingCount > 0 && (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-danger-light/50 p-2.5">
                  <input
                    type="checkbox"
                    checked={deleteMissing}
                    onChange={(e) => setDeleteMissing(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-input-border accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-danger">
                      {t('loiRule.import.deleteMissing')} ({preview.missingCount})
                    </span>
                    <span className="field-hint block">{t('loiRule.import.deleteMissingHint')}</span>
                  </span>
                </label>
              )}
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-card-border pt-4">
          <span className="field-hint mr-auto">
            {preview ? `${selectedCodes.length} ${t('loiRule.import.selectedSuffix')}` : ''}
          </span>
          <button type="button" onClick={onClose} className="btn-modal-ghost">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={!canCommit}
            onClick={() => setConfirmOpen(true)}
            className="btn-modal-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {committing ? t('loiRule.import.committing') : t('loiRule.import.commit')}
          </button>
        </div>
      </div>

      {confirmOpen && preview && (
        <ConfirmDialog
          title={t('loiRule.import.confirmTitle')}
          message={
            mode === LoiImportMode.ReplaceAll
              ? t('loiRule.import.confirmReplace')
              : t('loiRule.import.confirmMerge')
          }
          confirmLabel={t('loiRule.import.commit')}
          tone={mode === LoiImportMode.ReplaceAll ? 'danger' : 'primary'}
          busy={committing}
          onConfirm={runCommit}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </Modal>
  );
}
