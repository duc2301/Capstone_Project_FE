import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { MatrixArea } from '@/entities/permission-matrix';
import { areaLabel, AREA_OPTIONS, PermissionMatrixTable, usePermissionMatrix } from '@/features/permission-matrix';
import { useProjectDetail } from '@/features/projects';
import { ConfirmDialog, Toast, useToast } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 text-sm font-medium text-text-muted transition-colors hover:text-primary"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      {t('matrix.back')}
    </button>
  );
}

function StateCard({ tone, children }: { tone: 'danger' | 'muted'; children: React.ReactNode }) {
  const cls =
    tone === 'danger'
      ? 'border-danger/20 bg-danger-light text-danger'
      : 'border-card-border bg-card text-text-muted';
  return (
    <div className={`rounded-[var(--radius-card)] border p-6 text-center text-sm font-medium ${cls}`}>
      {children}
    </div>
  );
}

export function PermissionMatrixPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { project } = useProjectDetail(projectId);
  const matrix = usePermissionMatrix(projectId);
  const { toast, showToast } = useToast();

  // Đổi khu vực khi đang có thay đổi chưa lưu -> hỏi lại (reload sẽ bỏ diff).
  const [pendingArea, setPendingArea] = useState<{ area: MatrixArea | undefined } | null>(null);

  const goBack = () => navigate(`/projects/${projectId}`);

  const applyArea = (area: MatrixArea | undefined) => {
    if (matrix.dirtyCount > 0) setPendingArea({ area });
    else matrix.setArea(area);
  };

  const handleSave = async () => {
    const res = await matrix.save();
    if (res.message) showToast(res.message, res.ok ? 'success' : 'error');
  };

  const header = (
    <header className="flex flex-col gap-2 border-b border-card-border/60 pb-4">
      <BackButton onClick={goBack} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="heading-page">{t('matrix.title')}</h1>
          {project && <p className="mt-1 text-sm text-text-secondary">{project.projectName}</p>}
        </div>
      </div>
      <p className="max-w-3xl text-sm text-text-muted">{t('matrix.subtitle')}</p>
    </header>
  );

  let body: React.ReactNode;
  if (matrix.loading) {
    body = <StateCard tone="muted">{t('common.loading')}</StateCard>;
  } else if (matrix.forbidden) {
    body = <StateCard tone="danger">{matrix.accessMessage ?? t('matrix.forbidden')}</StateCard>;
  } else if (matrix.notFound) {
    body = <StateCard tone="danger">{matrix.accessMessage ?? t('matrix.notFound')}</StateCard>;
  } else if (matrix.error || !matrix.data) {
    body = (
      <div className="space-y-4">
        <StateCard tone="danger">{matrix.error ?? t('common.error')}</StateCard>
        <button type="button" onClick={() => void matrix.reload()} className="btn-modal-ghost">
          {t('matrix.retry')}
        </button>
      </div>
    );
  } else {
    const data = matrix.data;
    body = (
      <div className="space-y-4">
        {/* Thanh công cụ: lọc khu vực + lưu/huỷ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-text-secondary">{t('matrix.filter.area')}</label>
            <select
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

          <div className="flex items-center gap-3">
            {matrix.dirtyCount > 0 && (
              <span className="text-sm font-medium text-text-secondary">
                {t('matrix.dirty.count').replace('{n}', String(matrix.dirtyCount))}
              </span>
            )}
            <button
              type="button"
              onClick={matrix.discardChanges}
              disabled={matrix.dirtyCount === 0 || matrix.saving}
              className="btn-modal-ghost"
            >
              {t('matrix.action.discard')}
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={matrix.dirtyCount === 0 || matrix.saving}
              className="btn-modal-primary"
            >
              {matrix.saving ? t('matrix.action.saving') : t('matrix.action.save')}
            </button>
          </div>
        </div>

        {/* Phạm vi của leader: chỉ sửa được thư mục được uỷ quyền */}
        {!data.actor.isFullAccess && (
          <div className="rounded-[var(--radius-card)] border border-info/20 bg-info-light/50 px-4 py-3 text-sm text-text-secondary">
            {t('matrix.scope.leader')}
          </div>
        )}

        <PermissionMatrixTable data={data} matrix={matrix} />
      </div>
    );
  }

  return (
    <>
      <Toast toast={toast} className="z-[60]" />
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        {header}
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
