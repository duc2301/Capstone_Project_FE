import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { RelatedFile } from '@/entities/file-item';
import { t } from '@/shared/lib/i18n';

import { formatDate, formatSize } from '../model/fileFormat';
import { relatedFileAreaBadge } from '../model/relatedFileFormat';
import { useRelatedFiles } from '../model/useRelatedFiles';
import { RelatedFilesPicker } from './RelatedFilesPicker';

interface RelatedFilesPanelProps {
  projectId: string;
  fileItemId: string;
  folderId: string | null;
}

export function RelatedFilesPanel({ projectId, fileItemId, folderId }: RelatedFilesPanelProps) {
  const navigate = useNavigate();
  const { relatedFiles, canLink, loading, saving, error, addLinks, removeLink } = useRelatedFiles(fileItemId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const openRelatedFile = (file: RelatedFile) =>
    navigate(`/projects/${projectId}/files/${file.id}/view?folder=${file.folderId}`);

  const handleConfirmPicker = async (ids: string[]) => {
    setPickerOpen(false);
    if (ids.length > 0) await addLinks(ids);
  };

  const handleRemove = async (linkedFileItemId: string) => {
    setConfirmingId(null);
    await removeLink(linkedFileItemId);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
          {t('relatedFiles.panel.title')} ({relatedFiles.length})
        </p>
        {folderId && canLink && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {t('relatedFiles.panel.add')}
          </button>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-danger-light px-4 py-2.5 text-sm text-danger">{error}</p>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">{t('relatedFiles.panel.loading')}</p>
      ) : relatedFiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-card-border bg-input-bg/30 p-6 text-center">
          <p className="text-sm text-text-muted">{t('relatedFiles.panel.empty')}</p>
          <p className="mt-1 text-xs text-text-placeholder">{t('relatedFiles.panel.emptyHint')}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {relatedFiles.map((file) => {
            const area = relatedFileAreaBadge(file.area);
            return (
              <li key={file.id} className="rounded-xl border border-card-border transition-colors hover:bg-content-bg">
                <div className="flex items-start gap-3 px-3.5 py-3">
                  <button
                    type="button"
                    onClick={() => openRelatedFile(file)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium text-primary hover:underline">{file.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${area.className}`}>
                        {area.label}
                      </span>
                      <span className="text-xs text-text-muted">{file.folderName}</span>
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      v{file.currentVersionNumber}
                      {file.format ? ` · ${file.format.toUpperCase()}` : ''}
                      {file.sizeBytes > 0 ? ` · ${formatSize(file.sizeBytes)}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-text-placeholder">
                      {t('relatedFiles.panel.linkedAt')}: {formatDate(file.linkedAt)}
                      {file.linkedByName ? ` · ${file.linkedByName}` : ''}
                    </p>
                  </button>

                  {canLink && (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(file.id)}
                      disabled={saving}
                      title={t('relatedFiles.panel.unlink')}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger-light hover:text-danger disabled:opacity-40"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  )}
                </div>

                {confirmingId === file.id && (
                  <div className="border-t border-card-border bg-danger-light/40 px-3.5 py-2.5">
                    <p className="text-xs text-text-secondary">{t('relatedFiles.panel.unlinkConfirm')}</p>
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg"
                      >
                        {t('relatedFiles.panel.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(file.id)}
                        disabled={saving}
                        className="rounded-lg bg-danger px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                      >
                        {t('relatedFiles.panel.unlink')}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {pickerOpen && folderId && (
        <RelatedFilesPicker
          folderId={folderId}
          excludeFileItemId={fileItemId}
          selectedIds={[]}
          onConfirm={handleConfirmPicker}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
