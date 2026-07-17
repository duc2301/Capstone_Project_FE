import { useMemo, useState } from 'react';

import type { LinkableFile } from '@/entities/file-item';
import { t } from '@/shared/lib/i18n';

import { formatSize } from '../model/fileFormat';
import { useLinkableFiles } from '../model/useLinkableFiles';

interface RelatedFilesPickerProps {
  folderId: string;
  excludeFileItemId?: string;
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
  onClose: () => void;
}

function FileGlyph() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </span>
  );
}

export function RelatedFilesPicker({
  folderId,
  excludeFileItemId,
  selectedIds,
  onConfirm,
  onClose,
}: RelatedFilesPickerProps) {
  const { linkableFiles, loading, error } = useLinkableFiles(folderId, excludeFileItemId);
  const [picked, setPicked] = useState<string[]>(selectedIds);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return linkableFiles;
    return linkableFiles.filter(
      (f) => f.name.toLowerCase().includes(q) || f.folderName.toLowerCase().includes(q),
    );
  }, [linkableFiles, query]);

  const groups = useMemo(() => {
    const byFolder = new Map<string, LinkableFile[]>();
    for (const file of filtered) {
      const list = byFolder.get(file.folderName) ?? [];
      list.push(file);
      byFolder.set(file.folderName, list);
    }
    return [...byFolder.entries()];
  }, [filtered]);

  const toggle = (file: LinkableFile) => {
    if (file.alreadyLinked) return;
    setPicked((prev) =>
      prev.includes(file.id) ? prev.filter((id) => id !== file.id) : [...prev, file.id],
    );
  };

  const newlyPickedCount = picked.filter(
    (id) => !linkableFiles.some((f) => f.id === id && f.alreadyLinked),
  ).length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col animate-scale-in rounded-(--radius-card-lg) bg-card shadow-modal">
        <div className="flex items-start justify-between border-b border-card-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-primary">{t('relatedFiles.picker.title')}</h2>
            <p className="mt-0.5 text-xs text-text-muted">{t('relatedFiles.picker.scopeHint')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="border-b border-card-border px-6 py-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('relatedFiles.picker.search')}
            className="w-full rounded-xl border border-card-border bg-input-bg/50 px-3.5 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-placeholder focus:border-primary"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && <p className="py-8 text-center text-sm text-text-muted">{t('relatedFiles.picker.loading')}</p>}

          {!loading && error && (
            <p className="rounded-xl bg-danger-light px-4 py-3 text-center text-sm text-danger">{error}</p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p className="rounded-xl border border-dashed border-card-border bg-input-bg/30 p-6 text-center text-sm text-text-muted">
              {query.trim() ? t('relatedFiles.picker.noMatch') : t('relatedFiles.picker.empty')}
            </p>
          )}

          {!loading && !error && groups.map(([folderName, files]) => (
            <div key={folderName} className="mb-4 last:mb-0">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">{folderName}</p>
              <ul className="space-y-1.5">
                {files.map((file) => {
                  const checked = file.alreadyLinked || picked.includes(file.id);
                  return (
                    <li key={file.id}>
                      <label
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${file.alreadyLinked
                            ? 'cursor-default border-card-border bg-input-bg/30 opacity-60'
                            : `cursor-pointer ${checked ? 'border-primary bg-primary-ghost' : 'border-card-border hover:bg-content-bg'}`
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={file.alreadyLinked}
                          onChange={() => toggle(file)}
                          className="h-4 w-4 shrink-0 accent-[#406623]"
                        />
                        <FileGlyph />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text">{file.name}</p>
                          <p className="text-xs text-text-muted">
                            {file.displayVersion ?? `v${file.currentVersionNumber}`}
                            {file.format ? ` · ${file.format.toUpperCase()}` : ''}
                            {file.sizeBytes > 0 ? ` · ${formatSize(file.sizeBytes)}` : ''}
                          </p>
                        </div>
                        {file.alreadyLinked && (
                          <span className="shrink-0 rounded-full bg-content-bg px-2 py-0.5 text-xs font-semibold text-text-secondary">
                            {t('relatedFiles.picker.alreadyLinked')}
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-card-border px-6 py-4">
          <span className="text-xs text-text-muted">
            {t('relatedFiles.picker.selected')}: {newlyPickedCount}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg"
            >
              {t('relatedFiles.picker.cancel')}
            </button>
            <button
              type="button"
              onClick={() => onConfirm(picked)}
              className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              {t('relatedFiles.picker.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
