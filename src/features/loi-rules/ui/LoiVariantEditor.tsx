import { useMemo, useState } from 'react';

import type { LoiMatrixRow, LoiParamGroup, LoiRuleParameter, LoiStage } from '@/entities/loi-check';
import { LOI_STAGE_OPTIONS } from '@/entities/loi-check';
import { ActionIconButton, DeleteIcon } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { paramGroupLabel, paramGroupShortLabel, paramGroupTone, stageLabel, stageTone } from './loiRuleMeta';

const LABEL_COLUMN_WIDTH = 204;
const PARAM_COLUMN_WIDTH = 68;
const COLLAPSED_COLUMN_WIDTH = 44;
const ACTION_COLUMN_WIDTH = 100;
const GROUP_ROW_OFFSET = 'top-8';

type MatrixColumn =
  | { kind: 'param'; group: LoiParamGroup; parameter: LoiRuleParameter }
  | { kind: 'collapsed'; group: LoiParamGroup; count: number };

interface GroupSpan {
  group: LoiParamGroup;
  span: number;
  collapsed: boolean;
}

function buildColumns(parameters: LoiRuleParameter[], collapsed: Set<LoiParamGroup>) {
  const columns: MatrixColumn[] = [];
  const spans: GroupSpan[] = [];

  for (const parameter of parameters) {
    const last = spans[spans.length - 1];
    if (last && last.group === parameter.paramGroup) {
      if (!last.collapsed) last.span += 1;
      else continue;
    } else {
      const isCollapsed = collapsed.has(parameter.paramGroup);
      spans.push({ group: parameter.paramGroup, span: 1, collapsed: isCollapsed });
      if (isCollapsed) {
        columns.push({
          kind: 'collapsed',
          group: parameter.paramGroup,
          count: parameters.filter((p) => p.paramGroup === parameter.paramGroup).length,
        });
        continue;
      }
    }
    columns.push({ kind: 'param', group: parameter.paramGroup, parameter });
  }

  return { columns, spans };
}

const columnWidth = (column: MatrixColumn) =>
  column.kind === 'param' ? PARAM_COLUMN_WIDTH : COLLAPSED_COLUMN_WIDTH;

interface LoiVariantEditorProps {
  parameters: LoiRuleParameter[];
  rows: LoiMatrixRow[];
  saving: boolean;
  onSave: (rows: LoiMatrixRow[]) => void;
}

export function LoiVariantEditor({ parameters, rows, saving, onSave }: LoiVariantEditorProps) {
  const [draft, setDraft] = useState<LoiMatrixRow[]>(rows);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<LoiParamGroup>>(new Set());
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [baseline] = useState(() => JSON.stringify(rows));

  const { columns, spans } = useMemo(
    () => buildColumns(parameters, collapsedGroups),
    [parameters, collapsedGroups],
  );

  const dirty = JSON.stringify(draft) !== baseline;

  const emptyLabelRows = draft
    .map((row, index) => (row.fieldName.trim().length === 0 ? index : -1))
    .filter((index) => index >= 0);

  const noCellRows = draft
    .map((row, index) => (row.cells.length === 0 ? index : -1))
    .filter((index) => index >= 0);

  const duplicateLabelRows = draft
    .map((row, index) => {
      const label = row.fieldName.trim().toLowerCase();
      if (label.length === 0) return -1;
      const first = draft.findIndex((other) => other.fieldName.trim().toLowerCase() === label);
      return first === index ? -1 : index;
    })
    .filter((index) => index >= 0);

  const blockReason =
    emptyLabelRows.length > 0
      ? t('loiRule.matrix.blockEmptyLabel')
      : duplicateLabelRows.length > 0
        ? t('loiRule.matrix.blockDuplicateLabel')
        : noCellRows.length > 0
          ? t('loiRule.matrix.blockNoCell')
          : null;

  const invalidRows = new Set([...emptyLabelRows, ...duplicateLabelRows]);

  const tableMinWidth =
    LABEL_COLUMN_WIDTH + ACTION_COLUMN_WIDTH + columns.reduce((sum, col) => sum + columnWidth(col), 0);

  const toggleGroup = (group: LoiParamGroup) =>
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });

  const patchRow = (index: number, patch: Partial<LoiMatrixRow>) =>
    setDraft(draft.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const setCell = (rowIndex: number, paramName: string, stage: LoiStage | null) => {
    const row = draft[rowIndex];
    const cells = row.cells.filter((cell) => cell.paramName !== paramName);
    if (stage !== null) cells.push({ paramName, stage });
    const order = new Map(parameters.map((parameter, i) => [parameter.name, i]));
    cells.sort((a, b) => (order.get(a.paramName) ?? 0) - (order.get(b.paramName) ?? 0));
    patchRow(rowIndex, { cells });
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    const next = [...draft];
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  };

  const removeRow = (index: number) => setDraft(draft.filter((_, i) => i !== index));

  const addRow = () => setDraft([...draft, { fieldName: '', cells: [] }]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 rounded-[var(--radius-button)] border border-dashed border-card-border px-2.5 py-1 text-xs font-semibold text-text-secondary transition-colors hover:border-primary hover:bg-primary-ghost hover:text-primary"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('loiRule.matrix.addRow')}
        </button>

        <span className="field-hint">
          {parameters.length} {t('loiRule.matrix.paramCountSuffix')}
        </span>

        {dirty && <span className="field-hint">{t('loiRule.matrix.draftHint')}</span>}

        <div className="ml-auto flex items-center gap-2.5">
          <span className="flex items-center gap-1">
            {LOI_STAGE_OPTIONS.map((stage) => (
              <span
                key={stage}
                title={`${stage} · ${stageLabel(stage)}`}
                className={`flex h-4 w-4 items-center justify-center rounded text-2xs font-bold ${stageTone(stage)}`}
              >
                {stage}
              </span>
            ))}
          </span>
          {blockReason ? (
            <span className="field-hint text-danger">{blockReason}</span>
          ) : (
            dirty && <span className="field-hint text-warning">{t('loiRule.matrix.unsaved')}</span>
          )}
          <button
            type="button"
            disabled={!dirty || saving || blockReason !== null}
            title={blockReason ?? undefined}
            onClick={() => onSave(draft)}
            className="btn-modal-primary px-3 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t('loiRule.matrix.saving') : t('loiRule.matrix.save')}
          </button>
        </div>
      </div>

      <div className="admin-scrollbar min-h-0 flex-1 overflow-auto rounded-[var(--radius-card)] border border-card-border">
        <table className="w-full table-fixed border-collapse text-sm" style={{ minWidth: tableMinWidth }}>
          <colgroup>
            <col style={{ width: LABEL_COLUMN_WIDTH }} />
            {columns.map((column, index) => (
              <col
                key={column.kind === 'param' ? column.parameter.id : `collapsed-${index}`}
                style={{ width: columnWidth(column) }}
              />
            ))}
            <col style={{ width: ACTION_COLUMN_WIDTH }} />
          </colgroup>

          <thead>
            <tr className="h-8">
              <th className="sticky left-0 top-0 z-40 border-b border-card-border bg-content-bg shadow-[1px_0_0_0_var(--color-card-border)]" />
              {spans.map((span) => (
                <th
                  key={span.group}
                  colSpan={span.collapsed ? 1 : span.span}
                  className={`sticky top-0 z-20 cursor-pointer border-b border-r border-card-border px-1 text-2xs font-bold uppercase leading-5 tracking-wider transition-opacity hover:opacity-80 ${paramGroupTone(span.group)}`}
                  title={`${paramGroupLabel(span.group)} — ${span.collapsed ? t('loiRule.matrix.expandGroup') : t('loiRule.matrix.collapseGroup')}`}
                  onClick={() => toggleGroup(span.group)}
                >
                  {span.collapsed ? '›' : paramGroupShortLabel(span.group)}
                </th>
              ))}
              <th className="sticky right-0 top-0 z-30 border-b border-card-border bg-content-bg shadow-[-1px_0_0_0_var(--color-card-border)]" />
            </tr>
            <tr>
              <th
                className={`sticky left-0 ${GROUP_ROW_OFFSET} z-40 border-b border-card-border bg-content-bg px-3 py-1.5 text-left text-2xs font-bold uppercase tracking-wider text-text-secondary shadow-[1px_0_0_0_var(--color-card-border)]`}
              >
                {t('loiRule.matrix.fieldColumn')}
              </th>
              {columns.map((column, index) =>
                column.kind === 'param' ? (
                  <th
                    key={column.parameter.id}
                    title={column.parameter.name}
                    className={`sticky ${GROUP_ROW_OFFSET} z-20 border-b border-r border-card-border bg-content-bg px-1 py-1.5 align-bottom text-2xs font-semibold leading-tight text-text-secondary`}
                  >
                    <span className="cell-wrap block">{column.parameter.name}</span>
                  </th>
                ) : (
                  <th
                    key={`collapsed-${index}`}
                    className={`sticky ${GROUP_ROW_OFFSET} z-20 border-b border-r border-card-border bg-content-bg px-1 py-1.5 text-center text-2xs font-bold text-text-muted`}
                  >
                    {column.count}
                  </th>
                ),
              )}
              <th
                className={`sticky right-0 ${GROUP_ROW_OFFSET} z-30 border-b border-card-border bg-content-bg px-2 py-1.5 text-center text-2xs font-bold uppercase tracking-wider text-text-secondary shadow-[-1px_0_0_0_var(--color-card-border)]`}
              >
                {t('common.col.actions')}
              </th>
            </tr>
          </thead>

          <tbody>
            {draft.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-12 text-center">
                  <p className="text-sm text-text-muted">{t('loiRule.matrix.noRows')}</p>
                </td>
              </tr>
            ) : (
              draft.map((row, rowIndex) => (
                <tr key={rowIndex} className="group border-b border-card-border/60">
                  <td className="sticky left-0 z-10 bg-card px-2 py-1 shadow-[1px_0_0_0_var(--color-card-border)] transition-colors group-hover:bg-primary-ghost">
                    <input
                      value={row.fieldName}
                      onChange={(e) => patchRow(rowIndex, { fieldName: e.target.value })}
                      placeholder={t('loiRule.matrix.fieldPlaceholder')}
                      className={`field-input w-full px-2 py-1 text-xs ${
                        invalidRows.has(rowIndex) ? 'border-danger ring-1 ring-danger/40' : ''
                      }`}
                    />
                    {row.cells.length === 0 && (
                      <span className="field-hint mt-0.5 block text-warning">
                        {t('loiRule.matrix.rowWithoutCell')}
                      </span>
                    )}
                  </td>

                  {columns.map((column, index) => {
                    if (column.kind === 'collapsed') {
                      const hits = row.cells.filter((cell) =>
                        parameters.some(
                          (p) => p.name === cell.paramName && p.paramGroup === column.group,
                        ),
                      ).length;
                      return (
                        <td
                          key={`collapsed-${index}`}
                          className="border-r border-card-border bg-content-bg/40 px-1 py-1.5 text-center text-2xs font-bold text-text-muted transition-colors group-hover:bg-primary-ghost/60"
                        >
                          {hits > 0 ? hits : ''}
                        </td>
                      );
                    }

                    const parameter = column.parameter;
                    const cellKey = `${rowIndex}:${parameter.name}`;
                    const current = row.cells.find((cell) => cell.paramName === parameter.name);

                    if (editingCell === cellKey) {
                      return (
                        <td key={parameter.id} className="border-r border-card-border px-0.5 py-1.5 text-center transition-colors group-hover:bg-primary-ghost/40">
                          <select
                            autoFocus
                            value={current ? String(current.stage) : ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setCell(rowIndex, parameter.name, raw === '' ? null : (Number(raw) as LoiStage));
                              setEditingCell(null);
                            }}
                            onBlur={() => setEditingCell(null)}
                            className="field-select w-full px-1 py-1 pr-6 text-xs"
                          >
                            <option value="">{t('loiRule.matrix.stageNone')}</option>
                            {LOI_STAGE_OPTIONS.map((stage) => (
                              <option key={stage} value={stage}>
                                {stage} · {stageLabel(stage)}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    }

                    return (
                      <td key={parameter.id} className="border-r border-card-border px-0.5 py-1.5 text-center transition-colors group-hover:bg-primary-ghost/40">
                        <button
                          type="button"
                          onClick={() => setEditingCell(cellKey)}
                          title={
                            current
                              ? `${parameter.name} — ${stageLabel(current.stage)}`
                              : `${parameter.name} — ${t('loiRule.matrix.stageNone')}`
                          }
                          className={
                            current
                              ? `mx-auto flex h-6 w-6 items-center justify-center rounded-md text-2xs font-bold ${stageTone(current.stage)}`
                              : 'mx-auto flex h-6 w-6 items-center justify-center rounded-md text-2xs text-card-border transition-colors hover:bg-card hover:text-text hover:ring-1 hover:ring-primary/40'
                          }
                        >
                          {current ? current.stage : '–'}
                        </button>
                      </td>
                    );
                  })}

                  <td className="sticky right-0 z-20 bg-card px-1.5 py-1.5 shadow-[-1px_0_0_0_var(--color-card-border)] transition-colors group-hover:bg-primary-ghost">
                    <div className="flex items-center justify-center gap-0.5">
                      <ActionIconButton
                        size="sm"
                        label={t('loiRule.matrix.moveUp')}
                        disabled={rowIndex === 0}
                        onClick={() => moveRow(rowIndex, -1)}
                        icon={
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                        }
                      />
                      <ActionIconButton
                        size="sm"
                        label={t('loiRule.matrix.moveDown')}
                        disabled={rowIndex === draft.length - 1}
                        onClick={() => moveRow(rowIndex, 1)}
                        icon={
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        }
                      />
                      <ActionIconButton
                        size="sm"
                        tone="danger"
                        label={t('loiRule.matrix.removeRow')}
                        onClick={() => removeRow(rowIndex)}
                        icon={<DeleteIcon size={13} />}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
