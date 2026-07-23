import { useCallback, useEffect, useState } from 'react';

import type { FileVersion } from '@/entities/file-item';
import { fileItemApi } from '@/entities/file-item';
import { getApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

import { formatDate, formatSize } from '../model/fileFormat';

interface FileVersionsModalProps {
  fileItemId: string;
  fileName: string;
  currentVersionId: string | null;
  onClose: () => void;
  /** Gọi sau khi khôi phục thành công (để màn hình cha refetch danh sách file). */
  onRestored?: (displayVersion: string) => void;
}

export function FileVersionsModal({ fileItemId, fileName, currentVersionId, onClose, onRestored }: FileVersionsModalProps) {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Khôi phục: version đang chờ xác nhận, id đang khôi phục, lỗi thao tác.
  const [confirmVersion, setConfirmVersion] = useState<FileVersion | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadVersions = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      try {
        const { data } = await fileItemApi.getVersions(fileItemId);
        if (!isCancelled()) setVersions(data.result ?? []);
      } catch {
        if (!isCancelled()) setError(t('common.error'));
      } finally {
        if (!isCancelled()) setLoading(false);
      }
    },
    [fileItemId],
  );

  useEffect(() => {
    let cancelled = false;
    void loadVersions(() => cancelled);
    return () => { cancelled = true; };
  }, [loadVersions]);

  // Lịch sử từ server luôn kèm cờ isCurrent chuẩn. Chỉ dùng currentVersionId (từ prop,
  // có thể cũ sau khi khôi phục) làm phương án dự phòng khi server chưa đánh dấu bản nào.
  const hasServerCurrent = versions.some((v) => v.isCurrent);
  const isCurrent = (v: FileVersion) => (hasServerCurrent ? v.isCurrent : v.id === currentVersionId);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg animate-scale-in rounded-(--radius-card-lg) bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-bold text-text">{t('documents.versions.title')}</h2>
            <p className="truncate text-xs text-text-muted">{fileName}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {actionError && (
            <p className="mb-3 rounded-lg border border-danger/30 bg-danger-light px-3 py-2 text-xs font-medium text-danger">
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
                <li key={v.id} className="flex items-center gap-3 rounded-xl border border-card-border px-4 py-3">
                  <span className="flex h-9 min-w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10 px-2 text-sm font-bold text-primary">
                    {v.displayVersion}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text">
                      {formatSize(v.fileSizeBytes)} · {v.format.toUpperCase()}
                      {isCurrent(v) && (
                        <span className="ml-2 rounded-full bg-success-light px-2 py-0.5 text-[10px] font-semibold text-success">
                          {t('documents.versions.current')}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted">
                      {t('documents.versions.uploadedAt')}: {formatDate(v.createdAt)}
                    </p>
                  </div>
                  {!isCurrent(v) && (
                    <button
                      type="button"
                      onClick={() => { setActionError(null); setConfirmVersion(v); }}
                      disabled={restoringId !== null}
                      className="shrink-0 rounded-lg border border-card-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t('documents.versions.setCurrent')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Hộp xác nhận khôi phục phiên bản */}
        {confirmVersion && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-(--radius-card-lg) bg-black/30 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm animate-scale-in rounded-(--radius-card-lg) bg-card p-5 shadow-modal">
              <h3 className="font-heading text-base font-bold text-text">{t('documents.versions.confirmTitle')}</h3>
              <p className="mt-2 text-sm text-text-muted">
                {t('documents.versions.confirmDesc').replace('{version}', confirmVersion.displayVersion)}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmVersion(null)}
                  disabled={restoringId !== null}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-50"
                >
                  {t('documents.versions.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void handleRestore(confirmVersion)}
                  disabled={restoringId !== null}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {restoringId !== null ? t('documents.versions.restoring') : t('documents.versions.confirmYes')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
