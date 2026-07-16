import { useEffect, useState } from 'react';

import type { FileVersion } from '@/entities/file-item';
import { fileItemApi } from '@/entities/file-item';
import { t } from '@/shared/lib/i18n';

import { formatDate, formatSize } from '../model/fileFormat';

interface FileVersionsModalProps {
  fileItemId: string;
  fileName: string;
  currentVersionId: string | null;
  onClose: () => void;
}

export function FileVersionsModal({ fileItemId, fileName, currentVersionId, onClose }: FileVersionsModalProps) {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await fileItemApi.getVersions(fileItemId);
        if (!cancelled) setVersions(data.result ?? []);
      } catch {
        if (!cancelled) setError(t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fileItemId]);

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
                      {(v.isCurrent || v.id === currentVersionId) && (
                        <span className="ml-2 rounded-full bg-success-light px-2 py-0.5 text-[10px] font-semibold text-success">
                          {t('documents.versions.current')}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted">
                      {t('documents.versions.uploadedAt')}: {formatDate(v.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
