import { useState } from 'react';
import { useParams } from 'react-router-dom';

import type { MatrixArea } from '@/entities/permission-matrix';
import { areaLabel, AREA_OPTIONS, PermissionMatrixTable, usePermissionMatrix } from '@/features/permission-matrix';
import { useProjectDetail } from '@/features/projects';
import { ConfirmDialog, ListErrorCard, ListLoadingCard, Toast, ToolbarIconButton, useToast } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

const AREA_SELECT_ID = 'permission-matrix-area';

function DiscardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

export function PermissionMatrixPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { project } = useProjectDetail(projectId);
  const matrix = usePermissionMatrix(projectId);
  const { toast, showToast } = useToast();

  const [pendingArea, setPendingArea] = useState<{ area: MatrixArea | undefined } | null>(null);

  const applyArea = (area: MatrixArea | undefined) => {
    if (matrix.dirtyCount > 0) setPendingArea({ area });
    else matrix.setArea(area);
  };

  const handleSave = async () => {
    const res = await matrix.save();
    if (res.message) showToast(res.message, res.ok ? 'success' : 'error');
  };

  let body: React.ReactNode;
  if (matrix.loading) {
    body = <ListLoadingCard />;
  } else if (matrix.forbidden) {
    body = <ListErrorCard message={matrix.accessMessage ?? t('matrix.forbidden')} />;
  } else if (matrix.notFound) {
    body = <ListErrorCard message={matrix.accessMessage ?? t('matrix.notFound')} />;
  } else if (matrix.error || !matrix.data) {
    body = (
      <div className="flex flex-col items-center gap-4">
        <ListErrorCard message={matrix.error ?? t('common.error')} />
        <ToolbarIconButton
          variant="ghost"
          showLabel
          label={t('matrix.retry')}
          onClick={() => void matrix.reload()}
          icon={<DiscardIcon />}
        />
      </div>
    );
  } else {
    const data = matrix.data;
    body = (
      <>
        <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <label htmlFor={AREA_SELECT_ID} className="text-sm font-medium text-text-secondary">
              {t('matrix.filter.area')}
            </label>
            <select
              id={AREA_SELECT_ID}
              className="field-select w-auto border-card-border bg-card shadow-card"
              value={matrix.area ?? ''}
              onChange={(e) => applyArea(e.target.value === '' ? undefined : (Number(e.target.value) as MatrixArea))}
            >
              <option value="">{t('matrix.filter.allAreas')}</option>
              {AREA_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {areaLabel(a)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {matrix.dirtyCount > 0 && (
              <span className="inline-flex items-center rounded-[var(--radius-badge)] bg-accent-amber-tint px-3 py-1 text-xs font-bold text-accent-amber-strong">
                {t('matrix.dirty.count').replace('{n}', String(matrix.dirtyCount))}
              </span>
            )}
            <ToolbarIconButton
              variant="ghost"
              showLabel
              label={t('matrix.action.discard')}
              onClick={matrix.discardChanges}
              disabled={matrix.dirtyCount === 0 || matrix.saving}
              icon={<DiscardIcon />}
            />
            <ToolbarIconButton
              variant="solid"
              showLabel
              label={matrix.saving ? t('matrix.action.saving') : t('matrix.action.save')}
              onClick={() => void handleSave()}
              disabled={matrix.dirtyCount === 0 || matrix.saving}
              icon={<SaveIcon />}
            />
          </div>
        </div>

        {!data.actor.isFullAccess && (
          <div className="flex shrink-0 items-start gap-2.5 rounded-[var(--radius-card)] border border-info/20 bg-info-light px-4 py-3 text-sm text-text-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-info">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="cell-wrap">{t('matrix.scope.leader')}</span>
          </div>
        )}

        <PermissionMatrixTable data={data} matrix={matrix} />
      </>
    );
  }

  return (
    <>
      <Toast toast={toast} className="z-[60]" />

      <div className="flex h-full flex-col gap-5">
        <div className="flex shrink-0 flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h1 className="heading-page">{t('matrix.title')}</h1>
            {project && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary/80">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
                  <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
                </svg>
                {project.projectName}
              </span>
            )}
          </div>
        </div>

        {body}
      </div>

      {pendingArea && (
        <ConfirmDialog
          title={t('matrix.confirm.switchArea.title')}
          message={t('matrix.confirm.switchArea.desc')}
          confirmLabel={t('matrix.confirm.switchArea.submit')}
          cancelLabel={t('matrix.action.keepEditing')}
          tone="primary"
          onConfirm={() => {
            matrix.setArea(pendingArea.area);
            setPendingArea(null);
          }}
          onCancel={() => setPendingArea(null)}
        />
      )}
    </>
  );
}
