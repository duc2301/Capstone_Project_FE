import { useMemo, useState } from 'react';

import type { MatrixCell, PermissionMatrixResponse } from '@/entities/permission-matrix';
import { ToolbarIconButton } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import { collapsibleRowIds, flattenMatrixRows } from '../model/matrixTree';
import { levelLabel, levelLetter, levelSwatchClass } from '../model/permissionMatrixFormat';
import { PermissionLevel } from '@/entities/permission-matrix';
import type { UsePermissionMatrixReturn } from '../model/usePermissionMatrix';
import { PermissionCell } from './PermissionCell';

interface PermissionMatrixTableProps {
  data: PermissionMatrixResponse;
  matrix: Pick<UsePermissionMatrixReturn, 'valueOf' | 'isDirty' | 'setCell'>;
}

const NAME_COL_WIDTH = 340;
const GROUP_COL_WIDTH = 168;

const HEAD_CELL =
  'sticky top-0 z-20 border-b border-card-border bg-content-bg px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-text-muted';
const NAME_CELL = 'sticky left-0 border-b border-r border-card-border px-4 py-2.5 text-left align-middle';
const VALUE_CELL = 'border-b border-r border-card-border/60 px-2 py-1.5 text-center align-middle';

const LEGEND_LEVELS = [PermissionLevel.NoAccess, PermissionLevel.Read, PermissionLevel.Write];

function LegendItem({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {swatch}
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </span>
  );
}

const LEGEND_SWATCH = 'inline-flex h-6 min-w-9 items-center justify-center rounded-[var(--radius-input)] text-xs font-bold';

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {LEGEND_LEVELS.map((lvl) => (
        <LegendItem
          key={lvl}
          label={levelLabel(lvl)}
          swatch={<span className={`${LEGEND_SWATCH} border ${levelSwatchClass(lvl)}`}>{levelLetter(lvl)}</span>}
        />
      ))}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ExpandAllIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7 13 12 18 17 13" />
      <polyline points="7 6 12 11 17 6" />
    </svg>
  );
}

function CollapseAllIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 11 12 6 7 11" />
      <polyline points="17 18 12 13 7 18" />
    </svg>
  );
}

function TargetGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary/80">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

export function PermissionMatrixTable({ data, matrix }: PermissionMatrixTableProps) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const flat = useMemo(() => flattenMatrixRows(data.rows, collapsed), [data.rows, collapsed]);
  const columns = data.columns;

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(collapsibleRowIds(data.rows)));

  if (columns.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-[var(--radius-card-lg)] border border-dashed border-card-border bg-card p-10 text-center shadow-card">
        <p className="text-sm text-text-muted">{t('matrix.empty.columns')}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <Legend />
        <div className="flex items-center gap-2">
          <ToolbarIconButton
            size="sm"
            variant="ghost"
            showLabel
            label={t('matrix.tree.expandAll')}
            onClick={expandAll}
            icon={<ExpandAllIcon />}
          />
          <ToolbarIconButton
            size="sm"
            variant="ghost"
            showLabel
            label={t('matrix.tree.collapseAll')}
            onClick={collapseAll}
            icon={<CollapseAllIcon />}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
        <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
          <table
            className="w-full table-fixed border-separate border-spacing-0 text-sm"
            style={{ minWidth: NAME_COL_WIDTH + columns.length * GROUP_COL_WIDTH }}
          >
            <colgroup>
              <col style={{ width: NAME_COL_WIDTH }} />
              {columns.map((col) => (
                <col key={col.projectParticipantId} style={{ width: GROUP_COL_WIDTH }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className={`${HEAD_CELL} left-0 z-30 border-r text-left`}>
                  {t('matrix.col.target')}
                </th>
                {columns.map((col) => (
                  <th key={col.projectParticipantId} className={`${HEAD_CELL} text-center`} title={col.groupName}>
                    <span className="cell-wrap block leading-5">{col.groupName}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flat.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-sm text-text-muted">
                    {t('matrix.empty.rows')}
                  </td>
                </tr>
              ) : (
                flat.map(({ row, depth, hasChildren }) => {
                  const cellByPid = new Map<string, MatrixCell>(
                    row.cells.map((c) => [c.projectParticipantId, c]),
                  );
                  const isHeader = row.isRootArea || !row.assignable;

                  return (
                    <tr key={row.targetId} className={isHeader ? 'bg-primary-ghost' : 'group/row transition-colors hover:bg-primary-ghost'}>
                      <th
                        scope="row"
                        className={`${NAME_CELL} z-10 transition-colors ${isHeader ? 'bg-primary-ghost' : 'bg-card group-hover/row:bg-primary-ghost'}`}
                        style={{ paddingLeft: 16 + depth * 18 }}
                      >
                        <div className="flex items-start gap-1.5">
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => toggle(row.targetId)}
                              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-badge)] text-text-muted transition-colors hover:bg-content-bg hover:text-primary"
                              aria-label={collapsed.has(row.targetId) ? t('matrix.tree.expand') : t('matrix.tree.collapse')}
                            >
                              <Chevron open={!collapsed.has(row.targetId)} />
                            </button>
                          ) : (
                            <span className="inline-block w-5 shrink-0" />
                          )}
                          {isHeader ? (
                            <span className="text-xs font-bold uppercase leading-5 tracking-wider text-primary">{row.name}</span>
                          ) : (
                            <>
                              <span className="mt-0.5">
                                <TargetGlyph />
                              </span>
                              <span className="cell-wrap font-medium leading-5 text-text" title={row.name}>{row.name}</span>
                            </>
                          )}
                        </div>
                      </th>

                      {isHeader ? (
                        <td colSpan={columns.length} className="border-b border-card-border" />
                      ) : (
                        columns.map((col) => {
                          const cell = cellByPid.get(col.projectParticipantId);
                          return (
                            <td key={col.projectParticipantId} className={VALUE_CELL}>
                              {cell ? (
                                <PermissionCell
                                  row={row}
                                  cell={cell}
                                  value={matrix.valueOf(row, cell)}
                                  dirty={matrix.isDirty(row.targetId, col.projectParticipantId)}
                                  onChange={(level) => matrix.setCell(row, cell, level)}
                                />
                              ) : (
                                <span className="text-text-placeholder">—</span>
                              )}
                            </td>
                          );
                        })
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
