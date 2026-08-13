import { useState } from 'react';

import type { LoiRuleSet } from '@/entities/loi-check';
import {
  LoiAliasesTab,
  LoiComponentsTab,
  LoiImportModal,
  LoiParametersTab,
  LoiRuleSetFormModal,
  LoiRuleSetStats,
  LoiRuleSetToolbar,
  useLoiRuleSets,
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
  const {
    ruleSets,
    selected,
    selectRuleSet,
    loading,
    error,
    busy,
    reload,
    createRuleSet,
    updateRuleSet,
    deleteRuleSet,
    setDefaultRuleSet,
  } = useLoiRuleSets();

  const { toast, showToast } = useToast();
  const [tab, setTab] = useUrlTab<TabId>(TAB_IDS, 'components');
  const [formTarget, setFormTarget] = useState<LoiRuleSet | null | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const currentDefault = ruleSets.find((item) => item.isDefault) ?? null;
  const affectedProjects = currentDefault?.inheritingProjectCount ?? 0;
  const setDefaultMessage = [
    currentDefault ? `${t('loiRule.ruleSet.setDefaultFromLabel')} ${currentDefault.name}.` : null,
    affectedProjects > 0
      ? `${affectedProjects} ${t('loiRule.ruleSet.setDefaultAffectedSuffix')}`
      : t('loiRule.ruleSet.setDefaultNoneAffected'),
    t('loiRule.ruleSet.setDefaultConfirm'),
  ]
    .filter(Boolean)
    .join(' ');

  const handleSubmit = async (values: { name: string; description: string | null }) => {
    try {
      if (formTarget) await updateRuleSet(formTarget.id, values);
      else await createRuleSet(values);
      setFormTarget(undefined);
      showToast(t('loiRule.ruleSet.saved'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.ruleSet.saveError')), 'error');
    }
  };

  const handleSetDefault = async () => {
    if (!selected) return;
    try {
      await setDefaultRuleSet(selected.id);
      setDefaultOpen(false);
      showToast(t('loiRule.ruleSet.defaultUpdated'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.ruleSet.defaultError')), 'error');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteRuleSet(selected.id);
      setDeleteOpen(false);
      showToast(t('loiRule.ruleSet.deleted'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.ruleSet.deleteError')), 'error');
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <h1 className="heading-page shrink-0">{t('loiRule.title')}</h1>

      {!loading && !error && (
        <LoiRuleSetToolbar
          ruleSets={ruleSets}
          selected={selected}
          busy={busy}
          onSelect={selectRuleSet}
          onCreate={() => setFormTarget(null)}
          onEdit={() => setFormTarget(selected)}
          onSetDefault={() => setDefaultOpen(true)}
          onDelete={() => setDeleteOpen(true)}
          onImport={() => setImportOpen(true)}
        />
      )}

      {loading && <ListLoadingCard />}
      {!loading && error && <ListErrorCard message={error} />}

      {!loading && !error && (
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
            {selected && <LoiRuleSetStats ruleSet={selected} />}
          </div>

          {ruleSets.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[var(--radius-card-lg)] border border-dashed border-card-border bg-card text-center">
              <p className="text-sm text-text-muted">{t('loiRule.ruleSet.emptyState')}</p>
              <button type="button" onClick={() => setFormTarget(null)} className="btn-modal-primary">
                {t('loiRule.ruleSet.add')}
              </button>
            </div>
          ) : (
            <>
              {tab === 'components' && (
                <LoiComponentsTab
                  ruleSetId={selected?.id ?? null}
                  onRuleSetChanged={reload}
                  showToast={showToast}
                />
              )}
              {tab === 'parameters' && (
                <LoiParametersTab ruleSetId={selected?.id ?? null} showToast={showToast} />
              )}
              {tab === 'aliases' && (
                <LoiAliasesTab ruleSetId={selected?.id ?? null} showToast={showToast} />
              )}
            </>
          )}
        </>
      )}

      {formTarget !== undefined && (
        <LoiRuleSetFormModal
          ruleSet={formTarget}
          busy={busy}
          onSubmit={handleSubmit}
          onClose={() => setFormTarget(undefined)}
        />
      )}

      {defaultOpen && selected && (
        <ConfirmDialog
          title={t('loiRule.ruleSet.setDefaultTitle')}
          message={setDefaultMessage}
          confirmLabel={t('loiRule.ruleSet.setDefault')}
          tone="primary"
          busy={busy}
          onConfirm={handleSetDefault}
          onCancel={() => setDefaultOpen(false)}
        />
      )}

      {deleteOpen && selected && (
        <ConfirmDialog
          title={t('loiRule.ruleSet.deleteTitle')}
          message={t('loiRule.ruleSet.deleteConfirm')}
          confirmLabel={t('common.action.delete')}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}

      {importOpen && (
        <LoiImportModal
          ruleSet={selected}
          showToast={showToast}
          onClose={() => setImportOpen(false)}
          onImported={(saved) => {
            setImportOpen(false);
            selectRuleSet(saved.id);
            void reload();
          }}
        />
      )}

      <Toast toast={toast} className="z-[80]" />
    </div>
  );
}
