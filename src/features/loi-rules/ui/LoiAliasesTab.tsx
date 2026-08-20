import { useState } from 'react';

import type { LoiAlias } from '@/entities/loi-check';
import { getApiErrorMessage } from '@/shared/api';
import type { ListTableColumn } from '@/shared/components';
import {
  ActionIconButton,
  ConfirmDialog,
  DeleteIcon,
  ListErrorCard,
  ListLoadingCard,
  ListTable,
  PaginationBar,
  RowActions,
  SearchField,
} from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { useLoiParameters } from '../model/useLoiParameters';
import { useProjectLoiAliases } from '../model/useProjectLoiAliases';
import { LoiAliasFormModal } from './LoiAliasFormModal';

const PAGE_SIZE = 12;

const COLUMNS: ListTableColumn[] = [
  { key: 'model', label: t('loiRule.alias.columnModelName') },
  { key: 'arrow', label: '', width: 'w-[56px]', align: 'center' },
  { key: 'standard', label: t('loiRule.alias.columnStandardName') },
  { key: 'actions', label: t('common.col.actions'), width: 'w-[90px]', align: 'right' },
];

interface LoiAliasesTabProps {
  projectId: string;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export function LoiAliasesTab({ projectId, showToast }: LoiAliasesTabProps) {
  const { visible, loading, error, busy, search, setSearch, createAlias, deleteAlias } =
    useProjectLoiAliases(projectId);
  const { parameters } = useLoiParameters(projectId);

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LoiAlias | null>(null);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSubmit = async (values: { paramNameInModel: string; standardParamName: string }) => {
    try {
      await createAlias(values);
      setFormOpen(false);
      showToast(t('loiRule.alias.saved'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.alias.saveError')), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAlias(deleteTarget.id);
      setDeleteTarget(null);
      showToast(t('loiRule.alias.deleted'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.alias.deleteError')), 'error');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <p className="field-hint shrink-0">{t('loiRule.alias.intro')}</p>

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder={t('loiRule.alias.search')}
          className="w-full sm:max-w-[380px]"
        />
        <button type="button" onClick={() => setFormOpen(true)} className="btn-modal-primary shrink-0">
          {t('loiRule.alias.add')}
        </button>
      </div>

      {loading && <ListLoadingCard />}
      {!loading && error && <ListErrorCard message={error} />}

      {!loading && !error && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
            <ListTable columns={COLUMNS} minWidth="min-w-[620px]">
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-6 py-12 text-center">
                      <p className="text-sm text-text-muted">{t('common.noData')}</p>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((alias) => (
                    <tr key={alias.id} className="border-t border-card-border/60 hover:bg-primary-ghost">
                      <td className="px-6 py-3">
                        <span className="cell-wrap font-mono text-sm text-text">{alias.paramNameInModel}</span>
                      </td>
                      <td className="px-2 py-3 text-center text-text-muted">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </td>
                      <td className="px-5 py-3">
                        <span className="cell-wrap text-sm font-semibold text-primary">
                          {alias.standardParamName}
                        </span>
                        {alias.isSystemWide && (
                          <span className="mt-1 inline-flex rounded-[var(--radius-badge)] bg-content-bg px-2 py-0.5 text-2xs font-bold text-text-muted">
                            {t('loiRule.alias.systemBadge')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <RowActions>
                          {!alias.isSystemWide && (
                            <ActionIconButton
                              tone="danger"
                              label={t('common.action.delete')}
                              onClick={() => setDeleteTarget(alias)}
                              icon={<DeleteIcon />}
                            />
                          )}
                        </RowActions>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </ListTable>
          </div>

          <PaginationBar
            page={currentPage}
            pageCount={pageCount}
            pageSize={PAGE_SIZE}
            total={visible.length}
            unit={t('loiRule.alias.paginationUnit')}
            variant="inline"
            onChange={setPage}
          />
        </div>
      )}

      {formOpen && (
        <LoiAliasFormModal
          parameters={parameters}
          busy={busy}
          onSubmit={handleSubmit}
          onClose={() => setFormOpen(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t('loiRule.alias.deleteTitle')}
          message={t('loiRule.alias.deleteConfirm')}
          confirmLabel={t('common.action.delete')}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
