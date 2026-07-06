import type { FileListItem } from '@/entities/file-item';
import type { FolderTreeNode } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

import { fileStatusBadge, formatDate, formatSize } from '../model/fileFormat';

interface FileListProps {
  subfolders: FolderTreeNode[];
  files: FileListItem[];
  loading: boolean;
  error: string | null;
  onFolderOpen: (folder: FolderTreeNode) => void;
  onFolderMenu?: (e: React.MouseEvent, folder: FolderTreeNode) => void;
  onFileMenu: (e: React.MouseEvent, file: FileListItem) => void;
  onFileOpen: (file: FileListItem) => void;
}

function FileIcon() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </span>
  );
}

function FolderRowIcon() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    </span>
  );
}

function DotsButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-content-bg hover:text-text"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
      </svg>
    </button>
  );
}

export function FileList({ subfolders, files, loading, error, onFolderOpen, onFolderMenu, onFileMenu, onFileOpen }: FileListProps) {
  if (loading)
    return <p className="py-12 text-center text-sm text-text-muted">{t('common.loading')}</p>;
  if (error)
    return <p className="py-12 text-center text-sm text-danger">{error}</p>;
  if (subfolders.length === 0 && files.length === 0)
    return <p className="py-12 text-center text-sm text-text-muted">{t('documents.files.empty')}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-card-border text-left text-[11px] font-bold uppercase tracking-wider text-text-muted">
            <th className="py-2.5 pr-3 font-bold">{t('documents.files.colName')}</th>
            <th className="px-3 py-2.5 font-bold">{t('documents.files.colVersion')}</th>
            <th className="px-3 py-2.5 font-bold">{t('documents.files.colStatus')}</th>
            <th className="px-3 py-2.5 font-bold">{t('documents.files.colModified')}</th>
            <th className="px-3 py-2.5 font-bold">{t('documents.files.colAuthor')}</th>
            <th className="px-3 py-2.5 text-right font-bold">{t('documents.files.colActions')}</th>
          </tr>
        </thead>
        <tbody>
          {/* Thư mục con luôn hiển thị trước danh sách tệp (kiểu file explorer) */}
          {subfolders.map((folder) => (
            <tr
              key={folder.id}
              onClick={() => onFolderOpen(folder)}
              onContextMenu={(e) => onFolderMenu?.(e, folder)}
              title={t('documents.files.folderOpenHint')}
              className="cursor-pointer select-none border-b border-card-border/60 transition-colors hover:bg-content-bg/50"
            >
              <td className="py-3 pr-3">
                <div className="flex items-center gap-3">
                  <FolderRowIcon />
                  <p className="truncate font-medium text-text">{folder.name}</p>
                </div>
              </td>
              <td className="px-3 py-3">
                <span className="rounded-md bg-content-bg px-2 py-0.5 text-xs font-semibold text-text-secondary">
                  {t('documents.files.folderBadge')}
                </span>
              </td>
              <td className="px-3 py-3 text-text-muted">—</td>
              <td className="px-3 py-3 text-text-muted">—</td>
              <td className="px-3 py-3 text-text-muted">—</td>
              <td className="px-3 py-3 text-right">
                {onFolderMenu && (
                  <DotsButton onClick={(e) => { e.stopPropagation(); onFolderMenu(e, folder); }} />
                )}
              </td>
            </tr>
          ))}
          {files.map((f) => {
            const badge = fileStatusBadge(f);
            return (
              <tr
                key={f.id}
                onContextMenu={(e) => onFileMenu(e, f)}
                onDoubleClick={() => onFileOpen(f)}
                title={t('documents.files.openHint')}
                className="cursor-pointer select-none border-b border-card-border/60 transition-colors hover:bg-content-bg/50"
              >
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-3">
                    <FileIcon />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text">{f.name}</p>
                      <p className="text-xs text-text-muted">
                        {formatSize(f.sizeBytes)}{f.format ? ` · ${f.format.toUpperCase()}` : ''}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-md bg-content-bg px-2 py-0.5 text-xs font-semibold text-text-secondary">
                    V{f.currentVersionNumber}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                </td>
                <td className="px-3 py-3 text-text-secondary">{formatDate(f.updatedAt)}</td>
                <td className="px-3 py-3 text-text-secondary">{f.authorName ?? '—'}</td>
                <td className="px-3 py-3 text-right">
                  <DotsButton onClick={(e) => onFileMenu(e, f)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
