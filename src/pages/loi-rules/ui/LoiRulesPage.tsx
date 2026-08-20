import { useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  LoiAliasesTab,
  LoiComponentsTab,
  LoiImportModal,
  LoiParametersTab,
  LoiRuleSetFormModal,
  LoiRuleSetStats,
  LoiRuleSetToolbar,
  useProjectLoiRuleSet,
} from '@/features/loi-rules';
import { getApiErrorMessage } from '@/shared/api';
import { ConfirmDialog, ListErrorCard, ListLoadingCard, Toast, useToast } from '@/shared/components';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';
import { useUrlTab } from '@/shared/lib/url';

type TabId = 'components' | 'parameters' | 'aliases';
const TAB_IDS = ['components', 'parameters', 'aliases'] as const;
const TABS: { id: TabId; key: TranslationKey }[] = [
  { id: 'components', key: 'loiRule.tab.components' },
  { id: 'parameters', key: 'loiRule.tab.parameters' },
  { id: 'aliases', key: 'loiRule.tab.aliases' },
];

export function LoiRulesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { ruleSet, loading, error, busy, reload, renameRuleSet, deleteRuleSet } =
    useProjectLoiRuleSet(projectId);

  const { toast, showToast } = useToast();
  const [tab, setTab] = useUrlTab<TabId>(TAB_IDS, 'components');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const handleRename = async (values: { name: string; description: string | null }) => {
    try {
      await renameRuleSet(values);
      setFormOpen(false);
      showToast(t('loiRule.ruleSet.saved'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.ruleSet.saveError')), 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRuleSet();
      setDeleteOpen(false);
      showToast(t('loiRule.ruleSet.deleted'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.ruleSet.deleteError')), 'error');
    }
  };

  if (!projectId) return null;

  return (
    <div className="flex h-full flex-col gap-3">
      <h1 className="heading-page shrink-0">{t('loiRule.title')}</h1>

      {!loading && !error && (
        <LoiRuleSetToolbar
          ruleSet={ruleSet}
          busy={busy}
          onEdit={() => setFormOpen(true)}
          onDelete={() => setDeleteOpen(true)}
          onImport={() => setImportOpen(true)}
        />
      )}

      {loading && <ListLoadingCard />}
      {!loading && error && <ListErrorCard message={error} />}

      {!loading && !error && (
        ruleSet === null ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[var(--radius-card-lg)] border border-dashed border-card-border bg-card text-center">
            <p className="max-w-md text-sm text-text-muted">{t('loiRule.project.emptyState')}</p>
            <button type="button" onClick={() => setImportOpen(true)} className="btn-modal-primary">
              {t('loiRule.import.actionCreate')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-card-border">
              <div className="flex gap-1">
                {TABS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                      tab === item.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-text-secondary hover:text-text'
                    }`}
                  >
                    {t(item.key)}
                  </button>
                ))}
              </div>
              <LoiRuleSetStats ruleSet={ruleSet} />
            </div>

            {tab === 'components' && (
              <LoiComponentsTab projectId={projectId} onRuleSetChanged={reload} showToast={showToast} />
            )}
            {tab === 'parameters' && <LoiParametersTab projectId={projectId} showToast={showToast} />}
            {tab === 'aliases' && <LoiAliasesTab projectId={projectId} showToast={showToast} />}
          </>
        )
      )}

      {formOpen && ruleSet && (
        <LoiRuleSetFormModal
          ruleSet={ruleSet}
          busy={busy}
          onSubmit={handleRename}
          onClose={() => setFormOpen(false)}
        />
      )}

      {deleteOpen && ruleSet && (
        <ConfirmDialog
          title={t('loiRule.ruleSet.deleteTitle')}
          message={t('loiRule.project.deleteConfirm')}
          confirmLabel={t('common.action.delete')}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}

      {importOpen && (
        <LoiImportModal
          projectId={projectId}
          ruleSet={ruleSet}
          showToast={showToast}
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setImportOpen(false);
            void reload();
          }}
        />
      )}

      <Toast toast={toast} className="z-[80]" />
    </div>
  );
}
