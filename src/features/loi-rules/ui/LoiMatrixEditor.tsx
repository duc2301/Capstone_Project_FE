import { useMemo, useState } from 'react';

import type { LoiMatrix, LoiMatrixRow, LoiMatrixVariant } from '@/entities/loi-check';
import { ConfirmDialog, Modal } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { disciplineLabel, variantLabel } from './loiRuleMeta';
import { LoiVariantEditor } from './LoiVariantEditor';

const variantKey = (variant: string | null) => variant ?? '';

interface VariantNameModalProps {
  title: string;
  initialValue: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

function VariantNameModal({ title, initialValue, onSubmit, onClose }: VariantNameModalProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(value.trim());
        }}
        className="space-y-4"
      >
        <div>
          <label className="field-label mb-1.5">{t('loiRule.variant.nameLabel')}</label>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('loiRule.variant.namePlaceholder')}
            className="field-input w-full"
          />
          <p className="field-hint mt-1.5">{t('loiRule.variant.nameHint')}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-modal-ghost">
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn-modal-primary">
            {t('common.saveChanges')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface LoiMatrixEditorProps {
  matrix: LoiMatrix;
  saving: boolean;
  panelOpen: boolean;
  onTogglePanel: () => void;
  onSave: (variant: string | null, rows: LoiMatrixRow[]) => Promise<void>;
  onRenameVariant: (current: string | null, next: string | null) => Promise<void>;
  onDeleteVariant: (variant: string | null) => Promise<void>;
  onEditComponent: () => void;
}

export function LoiMatrixEditor({
  matrix,
  saving,
  panelOpen,
  onTogglePanel,
  onSave,
  onRenameVariant,
  onDeleteVariant,
  onEditComponent,
}: LoiMatrixEditorProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draftVariants, setDraftVariants] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const variants: LoiMatrixVariant[] = useMemo(() => {
    const existing = matrix.variants;
    const extra = draftVariants
      .filter((name) => !existing.some((item) => variantKey(item.variant) === name))
      .map((name) => ({ variant: name, rows: [] as LoiMatrixRow[] }));
    if (existing.length === 0 && extra.length === 0) {
      return [{ variant: null, rows: [] as LoiMatrixRow[] }];
    }
    return [...existing, ...extra];
  }, [matrix.variants, draftVariants]);

  const active =
    variants.find((item) => variantKey(item.variant) === activeKey) ?? variants[0];

  const handleSave = async (rows: LoiMatrixRow[]) => {
    const persisted = rows.filter((row) => row.fieldName.trim().length > 0 && row.cells.length > 0);
    await onSave(active.variant, persisted);
    setDraftVariants([]);
  };

  const handleAddVariant = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDraftVariants((current) => (current.includes(trimmed) ? current : [...current, trimmed]));
    setActiveKey(trimmed);
    setAddOpen(false);
  };

  const handleRenameVariant = async (name: string) => {
    const next = name.trim() || null;
    setRenameOpen(false);
    await onRenameVariant(active.variant, next);
    setActiveKey(variantKey(next));
  };

  const handleDeleteVariant = async () => {
    setDeleteOpen(false);
    await onDeleteVariant(active.variant);
    setActiveKey(null);
  };

  const isDraftVariant = active.variant !== null && draftVariants.includes(active.variant);
  const canRemoveVariant = !isDraftVariant && active.rows.length > 0;
  const removeBlockedReason = isDraftVariant
    ? t('loiRule.variant.needSaveFirst')
    : t('loiRule.variant.nothingToRemove');

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5">
      <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-card-border pb-2.5">
        <button
          type="button"
          onClick={onTogglePanel}
          title={panelOpen ? t('loiRule.matrix.hidePanel') : t('loiRule.matrix.showPanel')}
          aria-label={panelOpen ? t('loiRule.matrix.hidePanel') : t('loiRule.matrix.showPanel')}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-button)] text-text-muted transition-colors hover:bg-content-bg hover:text-text"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            {panelOpen ? <polyline points="15 9 12 12 15 15" /> : <polyline points="12 9 15 12 12 15" />}
          </svg>
        </button>

        <h2 className="heading-entity min-w-0 truncate">{matrix.componentName}</h2>
        <span className="field-hint shrink-0 font-mono">{matrix.componentCode}</span>
        <span className="field-hint shrink-0">{disciplineLabel(matrix.discipline)}</span>

        <span className="mx-1 h-5 w-px shrink-0 bg-card-border" />

        {variants.map((item) => {
          const key = variantKey(item.variant);
          const selected = key === variantKey(active.variant);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className={`shrink-0 rounded-[var(--radius-button)] px-2.5 py-1 text-xs font-semibold transition-colors ${
                selected
                  ? 'bg-primary text-white'
                  : 'border border-card-border bg-card text-text-secondary hover:bg-content-bg'
              }`}
            >
              {variantLabel(item.variant)}
              <span className={`ml-1.5 text-2xs ${selected ? 'text-white/70' : 'text-text-muted'}`}>
                {item.rows.length}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          title={t('loiRule.variant.addTitle')}
          className="shrink-0 rounded-[var(--radius-button)] border border-dashed border-card-border px-2.5 py-1 text-xs font-semibold text-text-secondary transition-colors hover:border-primary hover:text-primary"
        >
          {t('loiRule.variant.add')}
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={onEditComponent} className="btn-modal-ghost px-3 py-1 text-xs">
            {t('loiRule.component.edit')}
          </button>
          <button
            type="button"
            disabled={isDraftVariant}
            title={isDraftVariant ? t('loiRule.variant.needSaveFirst') : undefined}
            onClick={() => setRenameOpen(true)}
            className="btn-modal-ghost px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('loiRule.variant.rename')}
          </button>
          <button
            type="button"
            disabled={!canRemoveVariant}
            title={canRemoveVariant ? undefined : removeBlockedReason}
            onClick={() => setDeleteOpen(true)}
            className="btn-modal-danger px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('loiRule.variant.remove')}
          </button>
        </div>
      </div>

      <LoiVariantEditor
        key={`${matrix.componentId}|${variantKey(active.variant)}`}
        parameters={matrix.parameters}
        rows={active.rows}
        saving={saving}
        onSave={handleSave}
      />

      {addOpen && (
        <VariantNameModal
          title={t('loiRule.variant.addTitle')}
          initialValue=""
          onSubmit={handleAddVariant}
          onClose={() => setAddOpen(false)}
        />
      )}

      {renameOpen && (
        <VariantNameModal
          title={t('loiRule.variant.renameTitle')}
          initialValue={active.variant ?? ''}
          onSubmit={handleRenameVariant}
          onClose={() => setRenameOpen(false)}
        />
      )}

      {deleteOpen && (
        <ConfirmDialog
          title={t('loiRule.variant.removeTitle')}
          message={t('loiRule.variant.removeConfirm')}
          confirmLabel={t('loiRule.variant.remove')}
          busy={saving}
          onConfirm={handleDeleteVariant}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
