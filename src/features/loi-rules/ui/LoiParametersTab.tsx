import { useMemo, useState } from 'react';

import type { LoiDiscipline, LoiRuleParameter } from '@/entities/loi-check';
import { LOI_DISCIPLINE_OPTIONS, LoiDiscipline as Discipline } from '@/entities/loi-check';
import { getApiErrorMessage } from '@/shared/api';
import type { ListTableColumn } from '@/shared/components';
import {
  ActionIconButton,
  ConfirmDialog,
  DeleteIcon,
  EditIcon,
  ListErrorCard,
  ListLoadingCard,
  ListTable,
  PaginationBar,
  RowActions,
  SearchField,
} from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { useLoiParameters } from '../model/useLoiParameters';
import { LoiParameterFormModal } from './LoiParameterFormModal';
import { disciplineLabel, paramGroupLabel, paramGroupTone } from './loiRuleMeta';

const PAGE_SIZE = 12;

const COLUMNS: ListTableColumn[] = [
  { key: 'order', label: '#', width: 'w-[56px]' },
  { key: 'name', label: t('loiRule.parameter.columnName') },
  { key: 'discipline', label: t('loiRule.parameter.columnDiscipline'), width: 'w-[190px]' },
  { key: 'group', label: t('loiRule.parameter.columnGroup'), width: 'w-[200px]' },
  { key: 'usage', label: t('loiRule.parameter.columnUsage'), width: 'w-[140px]' },
  { key: 'actions', label: t('common.col.actions'), width: 'w-[110px]', align: 'right' },
];

interface LoiParametersTabProps {
  ruleSetId: string | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export function LoiParametersTab({ ruleSetId, showToast }: LoiParametersTabProps) {
  const { parameters, loading, error, busy, createParameter, updateParameter, deleteParameter } =
    useLoiParameters(ruleSetId);

  const [search, setSearch] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<LoiDiscipline>(Discipline.KienTrucKetCau);
  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<LoiRuleParameter | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<LoiRuleParameter | null>(null);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return parameters.filter(
      (parameter) =>
        parameter.discipline === disciplineFilter &&
        (!query || parameter.name.toLowerCase().includes(query)),
    );
  }, [parameters, search, disciplineFilter]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const nextOrderIndex = parameters.filter((p) => p.discipline === disciplineFilter).length;

  const handleSubmit = async (values: {
    name: string;
    discipline: LoiDiscipline;
    paramGroup: LoiRuleParameter['paramGroup'];
    orderIndex: number;
  }) => {
    try {
      if (formTarget) await updateParameter(formTarget.id, values);
      else await createParameter(values);
      setFormTarget(undefined);
      showToast(t('loiRule.parameter.saved'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.parameter.saveError')), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteParameter(deleteTarget.id);
      setDeleteTarget(null);
      showToast(t('loiRule.parameter.deleted'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.parameter.deleteError')), 'error');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <SearchField
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={t('loiRule.parameter.search')}
            className="w-full sm:max-w-[320px]"
          />
          <div className="flex items-center gap-1 rounded-[var(--radius-button)] bg-content-bg p-1">
            {LOI_DISCIPLINE_OPTIONS.map((discipline) => (
              <button
                key={discipline}
                type="button"
                onClick={() => {
                  setDisciplineFilter(discipline);
                  setPage(1);
                }}
                className={`rounded-[var(--radius-button)] px-3 py-1.5 text-xs font-semibold transition-colors ${
                  disciplineFilter === discipline
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-card'
                }`}
              >
                {disciplineLabel(discipline)}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => setFormTarget(null)} className="btn-modal-primary shrink-0">
          {t('loiRule.parameter.add')}
        </button>
      </div>

      {loading && <ListLoadingCard />}
      {!loading && error && <ListErrorCard message={error} />}

      {!loading && !error && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
            <ListTable columns={COLUMNS} minWidth="min-w-[720px]">
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-6 py-12 text-center">
                      <p className="text-sm text-text-muted">{t('common.noData')}</p>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((parameter) => (
                    <tr key={parameter.id} className="border-t border-card-border/60 hover:bg-primary-ghost">
                      <td className="px-6 py-3 font-mono text-xs text-text-muted">{parameter.orderIndex}</td>
                      <td className="px-5 py-3">
                        <span className="cell-wrap text-sm font-semibold text-text">{parameter.name}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="cell-wrap text-sm text-text-secondary">
                          {disciplineLabel(parameter.discipline)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-[var(--radius-badge)] px-2.5 py-0.5 text-xs font-bold ${paramGroupTone(parameter.paramGroup)}`}
                        >
                          {paramGroupLabel(parameter.paramGroup)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-text-secondary">
                          {parameter.usageCount > 0
                            ? `${parameter.usageCount} ${t('loiRule.parameter.usageUnit')}`
                            : t('loiRule.parameter.usageNone')}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <RowActions>
                          <ActionIconButton
                            tone="primary"
                            label={t('common.action.edit')}
                            onClick={() => setFormTarget(parameter)}
                            icon={<EditIcon />}
                          />
                          <ActionIconButton
                            tone="danger"
                            label={t('common.action.delete')}
                            onClick={() => setDeleteTarget(parameter)}
                            icon={<DeleteIcon />}
                          />
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
            unit={t('loiRule.parameter.paginationUnit')}
            variant="inline"
            onChange={setPage}
          />
        </div>
      )}

      {formTarget !== undefined && (
        <LoiParameterFormModal
          parameter={formTarget}
          defaultDiscipline={disciplineFilter}
          nextOrderIndex={nextOrderIndex}
          busy={busy}
          onSubmit={handleSubmit}
          onClose={() => setFormTarget(undefined)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t('loiRule.parameter.deleteTitle')}
          message={t('loiRule.parameter.deleteConfirm')}
          confirmLabel={t('common.action.delete')}
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
