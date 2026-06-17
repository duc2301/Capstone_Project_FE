import { useRef, useState } from 'react';

import type { FolderTreeNode } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

import { formatSize } from '../model/fileFormat';
import { useFileUpload } from '../model/useFileUpload';

type Status = 'pending' | 'uploading' | 'done' | 'error';
interface UFile {
  id: string;
  file: File;
  status: Status;
  progress: number;
}

interface UploadModalProps {
  targetFolder: FolderTreeNode;
  onClose: () => void;
  onUploaded: () => void;
}

export function UploadModal({ targetFolder, onClose, onUploaded }: UploadModalProps) {
  const { uploadToFolder } = useFileUpload();
  const [items, setItems] = useState<UFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const next: UFile[] = Array.from(list).map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0,
    }));
    setItems((prev) => [...prev, ...next]);
  };

  const update = (id: string, patch: Partial<UFile>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const handleUpload = async () => {
    const pending = items.filter((i) => i.status === 'pending' || i.status === 'error');
    if (pending.length === 0) return;
    setBusy(true);
    let anyOk = false;
    for (const it of pending) {
      update(it.id, { status: 'uploading', progress: 0 });
      try {
        await uploadToFolder(targetFolder.id, it.file, (p) => update(it.id, { progress: p }));
        update(it.id, { status: 'done', progress: 100 });
        anyOk = true;
      } catch {
        update(it.id, { status: 'error' });
      }
    }
    setBusy(false);
    if (anyOk) onUploaded();
  };

  const doneCount = items.filter((i) => i.status === 'done').length;
  const hasPending = items.some((i) => i.status === 'pending' || i.status === 'error');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-xl flex-col animate-scale-in rounded-(--radius-card-lg) bg-card shadow-modal">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-card-border px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-primary">{t('documents.uploadModal.title')}</h2>
            <p className="text-xs text-text-muted">{t('brand.name')}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:opacity-40">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          {/* Thư mục đích */}
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">{t('documents.uploadModal.target')}</p>
            <div className="flex items-center gap-2 rounded-xl border border-card-border bg-input-bg/50 px-3.5 py-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span className="truncate text-sm font-medium text-text">{targetFolder.name}</span>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${dragOver ? 'border-primary bg-primary-ghost' : 'border-card-border bg-input-bg/30'}`}
          >
            <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
            <p className="font-semibold text-text">{t('documents.uploadModal.dropHere')}</p>
            <p className="text-sm text-text-muted">
              {t('documents.uploadModal.chooseLead')}
              <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold text-primary hover:underline">
                {t('documents.uploadModal.choose')}
              </button>
            </p>
            <p className="mt-1 text-xs text-text-placeholder">{t('documents.uploadModal.hint')}</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>

          {/* Danh sách tệp */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
              {t('documents.uploadModal.list')} ({items.length})
            </p>
            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-card-border bg-input-bg/30 p-4 text-center text-sm text-text-muted">
                {t('documents.uploadModal.empty')}
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center gap-3 rounded-xl border border-card-border px-3.5 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{it.file.name}</p>
                      <p className="text-xs text-text-muted">{formatSize(it.file.size)}</p>
                      {it.status === 'uploading' && (
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-content-bg">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${it.progress}%` }} />
                        </div>
                      )}
                    </div>
                    {it.status === 'uploading' && <span className="shrink-0 text-xs font-semibold text-primary">{it.progress}%</span>}
                    {it.status === 'done' && <span className="shrink-0 rounded-full bg-success-light px-2 py-0.5 text-xs font-semibold text-success">{t('documents.uploadModal.done')}</span>}
                    {it.status === 'error' && <span className="shrink-0 rounded-full bg-danger-light px-2 py-0.5 text-xs font-semibold text-danger">{t('documents.uploadModal.failed')}</span>}
                    {(it.status === 'pending' || it.status === 'error') && !busy && (
                      <button type="button" onClick={() => removeItem(it.id)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-content-bg hover:text-danger">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-card-border px-6 py-4">
          <span className="text-xs text-text-muted">{doneCount}/{items.length} {t('documents.uploadModal.done').toLowerCase()}</span>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-40">
              {t('documents.uploadModal.cancel')}
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={busy || !hasPending}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              {busy ? t('documents.uploadModal.uploading') : t('documents.uploadModal.submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
