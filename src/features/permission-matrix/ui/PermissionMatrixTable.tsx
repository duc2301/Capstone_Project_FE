import { useMemo, useState } from 'react';

import type { MatrixCell, PermissionMatrixResponse } from '@/entities/permission-matrix';
import { MatrixTargetType } from '@/entities/permission-matrix';
import { t } from '@/shared/lib/i18n';
import { collapsibleRowIds, flattenMatrixRows } from '../model/matrixTree';
import { levelLabel, levelSwatchClass } from '../model/permissionMatrixFormat';
import { PermissionLevel } from '@/entities/permission-matrix';
import type { UsePermissionMatrixReturn } from '../model/usePermissionMatrix';
import { PermissionCell } from './PermissionCell';

interface PermissionMatrixTableProps {
  data: PermissionMatrixResponse;
  matrix: Pick<UsePermissionMatrixReturn, 'valueOf' | 'isDirty' | 'setCell'>;
}

/* Chú thích màu các mức quyền. */
function Legend() {
  const items = [PermissionLevel.NoAccess, PermissionLevel.Read, PermissionLevel.Write];
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
      {items.map((lvl) => (
        <span key={lvl} className="inline-flex items-center gap-1.5">
          <span className={`inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] font-bold ${levelSwatchClass(lvl)}`} />
          {levelLabel(lvl)}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 italic opacity-75">
        <span className="inline-block h-4 w-4 rounded border border-dashed border-card-border" />
        {t('matrix.legend.inherited')}
      </span>
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

function TargetGlyph({ isFolder }: { isFolder: boolean }) {
  return isFolder ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary/80">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

const HEAD_CELL =
  'sticky top-0 z-20 border-b border-card-border bg-content-bg px-3 py-3 text-xs font-bold uppercase tracking-wide text-text-muted';
const NAME_CELL = 'sticky left-0 border-b border-card-border bg-card px-3 py-2 text-left align-middle';

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
      <div className="rounded-[var(--radius-card)] border border-dashed border-card-border bg-card/70 p-10 text-center">
        <p className="text-sm text-text-muted">{t('matrix.empty.columns')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Legend />
        <div className="flex items-center gap-2">
          <button type="button" onClick={expandAll} className="rounded-md border border-card-border bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg">
            {t('matrix.tree.expandAll')}
          </button>
          <button type="button" onClick={collapseAll} className="rounded-md border border-card-border bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg">
            {t('matrix.tree.collapseAll')}
          </button>
        </div>
      </div>

      <div className="admin-scrollbar max-h-[calc(100vh-320px)] overflow-auto rounded-[var(--radius-card)] border border-card-border bg-card shadow-card">
        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className={`${HEAD_CELL} left-0 z-30 min-w-[260px] text-left`}>
                {t('matrix.col.target')}
              </th>
              {columns.map((col) => (
                <th key={col.projectParticipantId} className={`${HEAD_CELL} min-w-[120px] text-center`} title={col.groupName}>
                  {col.groupName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flat.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-3 py-10 text-center text-sm italic text-text-muted">
                  {t('matrix.empty.rows')}
                </td>
              </tr>
            ) : (
              flat.map(({ row, depth, hasChildren }) => {
                const cellByPid = new Map<string, MatrixCell>(
                  row.cells.map((c) => [c.projectParticipantId, c]),
                );
                const isFolder = row.targetType === MatrixTargetType.Folder;
                const isHeader = row.isRootArea || !row.assignable;

                return (
                  <tr key={row.targetId} className={isHeader ? 'bg-primary/[0.04]' : 'group/row hover:bg-content-bg'}>
                    <th
                      scope="row"
                      className={`${NAME_CELL} transition-colors ${isHeader ? 'z-10 bg-primary/[0.06]' : 'z-10 group-hover/row:bg-content-bg'}`}
                      style={{ paddingLeft: 12 + depth * 18 }}
                    >
                      <div className="flex items-center gap-1.5">
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggle(row.targetId)}
                            className="flex h-5 w-5 items-center justify-center rounded text-text-muted transition-colors hover:bg-content-bg hover:text-primary"
                            aria-label={collapsed.has(row.targetId) ? t('matrix.tree.expand') : t('matrix.tree.collapse')}
                          >
                            <Chevron open={!collapsed.has(row.targetId)} />
                          </button>
                        ) : (
                          <span className="inline-block w-5" />
                        )}
                        {isHeader ? (
                          <span className="text-xs font-bold uppercase tracking-wide text-primary">{row.name}</span>
                        ) : (
                          <>
                            <TargetGlyph isFolder={isFolder} />
                            <span className="truncate font-medium text-text" title={row.name}>{row.name}</span>
                          </>
                        )}
                      </div>
                    </th>

                    {isHeader ? (
                      <td colSpan={columns.length} className="border-b border-card-border bg-primary/[0.02]" />
                    ) : (
                      columns.map((col) => {
                        const cell = cellByPid.get(col.projectParticipantId);
                        return (
                          <td key={col.projectParticipantId} className="border-b border-card-border px-2 py-1.5 text-center align-middle">
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
  );
}
