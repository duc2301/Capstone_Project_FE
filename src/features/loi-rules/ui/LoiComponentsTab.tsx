import { useState } from 'react';

import type { LoiDiscipline, LoiMatrixRow } from '@/entities/loi-check';
import { getApiErrorMessage } from '@/shared/api';
import { ConfirmDialog, ListErrorCard, ListLoadingCard } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { useLoiComponents } from '../model/useLoiComponents';
import { useLoiMatrix } from '../model/useLoiMatrix';
import { LoiComponentFormModal } from './LoiComponentFormModal';
import { LoiComponentPanel } from './LoiComponentPanel';
import { LoiMatrixEditor } from './LoiMatrixEditor';

interface LoiComponentsTabProps {
  ruleSetId: string | null;
  onRuleSetChanged: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export function LoiComponentsTab({ ruleSetId, onRuleSetChanged, showToast }: LoiComponentsTabProps) {
  const {
    components,
    visible,
    loading,
    error,
    busy,
    search,
    setSearch,
    disciplineFilter,
    setDisciplineFilter,
    createComponent,
    updateComponent,
    deleteComponent,
  } = useLoiComponents(ruleSetId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const selected = components.find((component) => component.id === selectedId) ?? null;

  const { matrix, loading: matrixLoading, error: matrixError, saving, saveVariant, renameVariant, deleteVariant } =
    useLoiMatrix(ruleSetId, selected?.id ?? null);

  const afterRuleChange = () => {
    onRuleSetChanged();
  };

  const handleCreate = async (values: { code: string; name: string; discipline: LoiDiscipline }) => {
    try {
      const created = await createComponent(values);
      setSelectedId(created.id);
      setFormOpen(false);
      afterRuleChange();
      showToast(t('loiRule.component.created'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.component.saveError')), 'error');
    }
  };

  const handleUpdate = async (values: { code: string; name: string; discipline: LoiDiscipline }) => {
    if (!selected) return;
    try {
      await updateComponent(selected.id, values);
      setEditOpen(false);
      showToast(t('loiRule.component.saved'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.component.saveError')), 'error');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteComponent(selected.id);
      setSelectedId(null);
      setDeleteOpen(false);
      setEditOpen(false);
      afterRuleChange();
      showToast(t('loiRule.component.deleted'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.component.deleteError')), 'error');
    }
  };

  const handleSaveVariant = async (variant: string | null, rows: LoiMatrixRow[]) => {
    try {
      await saveVariant(variant, rows);
      afterRuleChange();
      showToast(t('loiRule.matrix.saved'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.matrix.saveError')), 'error');
    }
  };

  const handleRenameVariant = async (current: string | null, next: string | null) => {
    try {
      await renameVariant(current, next);
      showToast(t('loiRule.variant.renamed'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.variant.renameError')), 'error');
    }
  };

  const handleDeleteVariant = async (variant: string | null) => {
    try {
      await deleteVariant(variant);
      afterRuleChange();
      showToast(t('loiRule.variant.removed'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.variant.removeError')), 'error');
    }
  };

  return (
    <div
      className={`grid min-h-0 flex-1 grid-cols-1 gap-3 ${
        panelOpen ? 'lg:grid-cols-[292px_minmax(0,1fr)]' : 'lg:grid-cols-1'
      }`}
    >
      {panelOpen && (
        <LoiComponentPanel
          components={visible}
          totalCount={components.length}
          selectedId={selectedId}
          loading={loading}
          error={error}
          search={search}
          disciplineFilter={disciplineFilter}
          onSearchChange={setSearch}
          onDisciplineChange={setDisciplineFilter}
          onSelect={(component) => setSelectedId(component.id)}
          onCreate={() => setFormOpen(true)}
        />
      )}

      <div className="flex min-h-0 flex-col rounded-[var(--radius-card-lg)] border border-card-border bg-card p-4 shadow-card">
        {!selected && !panelOpen && (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="mb-3 self-start rounded-[var(--radius-button)] border border-card-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-content-bg"
          >
            {t('loiRule.matrix.showPanel')}
          </button>
        )}

        {!selected && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-text-placeholder">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="9" x2="9" y2="21" />
            </svg>
            <p className="text-sm text-text-muted">{t('loiRule.matrix.pickComponent')}</p>
          </div>
        )}

        {selected && matrixLoading && <ListLoadingCard />}
        {selected && !matrixLoading && matrixError && <ListErrorCard message={matrixError} />}

        {selected && !matrixLoading && !matrixError && matrix && (
          <LoiMatrixEditor
            matrix={matrix}
            saving={saving}
            panelOpen={panelOpen}
            onTogglePanel={() => setPanelOpen((open) => !open)}
            onSave={handleSaveVariant}
            onRenameVariant={handleRenameVariant}
            onDeleteVariant={handleDeleteVariant}
            onEditComponent={() => setEditOpen(true)}
          />
        )}
      </div>

      {formOpen && (
        <LoiComponentFormModal
          component={null}
          busy={busy}
          onSubmit={handleCreate}
          onClose={() => setFormOpen(false)}
        />
      )}

      {editOpen && selected && (
        <LoiComponentFormModal
          component={selected}
          busy={busy}
          onSubmit={handleUpdate}
          onDelete={() => setDeleteOpen(true)}
          onClose={() => setEditOpen(false)}
        />
      )}

      {deleteOpen && selected && (
        <ConfirmDialog
          title={t('loiRule.component.deleteTitle')}
          message={t('loiRule.component.deleteConfirm')}
          confirmLabel={t('common.action.delete')}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
