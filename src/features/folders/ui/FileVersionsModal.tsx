import { useCallback, useState } from 'react';

import type { FileVersion } from '@/entities/file-item';
import { fileItemApi } from '@/entities/file-item';
import { getApiErrorMessage } from '@/shared/api';
import { ActionIconButton, ConfirmDialog, Modal, RowActions } from '@/shared/components';
import { useAsyncData } from '@/shared/lib/async';
import { buildDownloadName, downloadBlob } from '@/shared/lib/download';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';

import { formatDate, formatSize } from '../model/fileFormat';

const EMPTY_VERSIONS: FileVersion[] = [];

interface FileVersionsModalProps {
  fileItemId: string;
  fileName: string;
  currentVersionId: string | null;
  canRestore?: boolean;
  onClose: () => void;
  onRestored?: (displayVersion: string) => void;
  onViewVersion?: (versionStateId: string, isCurrent: boolean) => void;
}

export function FileVersionsModal({
  fileItemId,
  fileName,
  currentVersionId,
  canRestore = false,
  onClose,
  onRestored,
  onViewVersion,
}: FileVersionsModalProps) {
  const [confirmVersion, setConfirmVersion] = useState<FileVersion | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    const { data } = await fileItemApi.getVersions(fileItemId);
    return sortByNewest(data.result ?? [], (v) => v.createdAt);
  }, [fileItemId]);

  const { data: versions, loading, error, reload: loadVersions } = useAsyncData(
    fileItemId,
    fetchVersions,
    {
      fallback: EMPTY_VERSIONS,
      toErrorMessage: () => t('common.error'),
    },
  );

  const hasServerCurrent = versions.some((v) => v.isCurrent);
  const isCurrent = (v: FileVersion) => (hasServerCurrent ? v.isCurrent : v.id === currentVersionId);

  const handleDownload = async (v: FileVersion) => {
    setActionError(null);
    setDownloadingId(v.id);
    try {
      const res = await fileItemApi.downloadVersion(fileItemId, v.id);
      downloadBlob(res.data as Blob, buildDownloadName(v.fileName || fileName, v.format));
    } catch (err) {
      setActionError(getApiErrorMessage(err, t('common.error')));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRestore = async (v: FileVersion) => {
    setActionError(null);
    setRestoringId(v.id);
    try {
      const { data } = await fileItemApi.restoreVersion(fileItemId, v.id);
      const label = data.result?.displayVersion ?? v.displayVersion;
      setConfirmVersion(null);
      await loadVersions();
      onRestored?.(label);
    } catch (err) {
      setActionError(getApiErrorMessage(err, t('common.error')));
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <>
      <Modal title={t('documents.versions.title')} onClose={onClose} maxWidth="max-w-lg">
        <p className="field-hint mb-4 truncate">{fileName}</p>

        {actionError && (
          <p className="mb-3 rounded-[var(--radius-input)] border border-danger/30 bg-danger-light px-3 py-2 text-xs font-medium text-danger">
            {actionError}
          </p>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm text-text-muted">{t('common.loading')}</p>
        ) : error ? (
          <p className="py-8 text-center text-sm text-danger">{error}</p>
        ) : versions.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">{t('documents.versions.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((v) => (
              <li
                key={v.id}
                onClick={onViewVersion ? () => onViewVersion(v.id, isCurrent(v)) : undefined}
                className={`flex items-center gap-3 rounded-[var(--radius-input)] border border-card-border px-4 py-3 ${
                  onViewVersion ? 'cursor-pointer transition-colors hover:border-primary hover:bg-primary-ghost' : ''
                }`}
              >
                <span className="flex h-9 min-w-16 shrink-0 items-center justify-center rounded-[var(--radius-input)] bg-primary/10 px-2 text-sm font-bold text-primary">
                  {v.displayVersion}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">
                    {formatSize(v.fileSizeBytes)} · {v.format.toUpperCase()}
                    {isCurrent(v) && (
                      <span className="ml-2 rounded-[var(--radius-badge)] bg-success-light px-2 py-0.5 text-2xs font-semibold text-success">
                        {t('documents.versions.current')}
                      </span>
                    )}
                  </p>
                  <p className="field-hint">
                    {t('documents.versions.uploadedAt')}: {formatDate(v.uploadedAt ?? v.createdAt)}
                    {v.uploadedByName ? ` · ${v.uploadedByName}` : ''}
                  </p>
                </div>
                <RowActions>
                  <ActionIconButton
                    tone="primary"
                    label={downloadingId === v.id
                      ? t('documents.versions.downloading')
                      : t('documents.versions.download')}
                    disabled={downloadingId !== null}
                    onClick={(e) => { e.stopPropagation(); void handleDownload(v); }}
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>}
                  />
                  {canRestore && !isCurrent(v) && (
                    <ActionIconButton
                      tone="primary"
                      label={t('documents.versions.setCurrent')}
                      disabled={restoringId !== null}
                      onClick={(e) => { e.stopPropagation(); setActionError(null); setConfirmVersion(v); }}
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>}
                    />
                  )}
                </RowActions>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {confirmVersion && (
        <ConfirmDialog
          title={t('documents.versions.confirmTitle')}
          message={t('documents.versions.confirmDesc').replace('{version}', confirmVersion.displayVersion)}
          confirmLabel={restoringId !== null ? t('documents.versions.restoring') : t('documents.versions.confirmYes')}
          cancelLabel={t('documents.versions.cancel')}
          tone="primary"
          busy={restoringId !== null}
          onConfirm={() => void handleRestore(confirmVersion)}
          onCancel={() => setConfirmVersion(null)}
        />
      )}
    </>
  );
}
