import { useState } from 'react';

import type { FileListItem } from '@/entities/file-item';
import type { FolderTreeNode } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

import { fileStatusBadge, fileTypeLabel, formatDate, formatSize } from '../model/fileFormat';

/* Tóm tắt AI dưới tên file: mặc định cắt 1 dòng (…), "Xem thêm" mở rộng XUỐNG DƯỚI
 * (không kéo dài hàng sang phải), "Thu gọn" để đóng lại — kiểu Facebook. */
function FileDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 80; // ngắn thì 1 dòng hiện đủ, khỏi cần nút

  return (
    <div className="mt-0.5 text-xs text-text-muted" onDoubleClick={(e) => e.stopPropagation()}>
      {expanded ? (
        <p className="whitespace-pre-line break-words">
          {text}{' '}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
            className="font-semibold text-primary hover:underline"
          >
            {t('fileSummary.less')}
          </button>
        </p>
      ) : (
        <p className="flex items-baseline gap-1">
          <span className="min-w-0 flex-1 truncate">{text}</span>
          {isLong && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
              className="shrink-0 font-semibold text-primary hover:underline"
            >
              {t('fileSummary.more')}
            </button>
          )}
        </p>
      )}
    </div>
  );
}

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

function WarningIcon({ message }: { message?: string | null }) {
  return (
    <span
      title={message ?? t('fileWarn.tooltip')}
      className="inline-flex shrink-0 items-center text-danger"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </span>
  );
}

/* Nút 3 chấm — ẩn mặc định, hiện khi hover lên dòng (tr có class "group") */
function DotsButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted opacity-0 transition-all hover:bg-content-bg hover:text-text focus-visible:opacity-100 group-hover:opacity-100"
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
            <th className="whitespace-nowrap px-3 py-2.5 font-bold">{t('documents.files.colVersion')}</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-bold">{t('documents.files.colType')}</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-bold">{t('documents.files.colStatus')}</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-bold">{t('documents.files.colSize')}</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-bold">{t('documents.files.colModified')}</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-bold">{t('documents.files.colAuthor')}</th>
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
              className="group cursor-pointer select-none border-b border-card-border/60 transition-colors hover:bg-content-bg/50"
            >
              <td className="py-3 pr-3">
                <div className="flex items-center gap-3">
                  <FolderRowIcon />
                  <p className="truncate font-medium text-text">{folder.name}</p>
                </div>
              </td>
              <td className="px-3 py-3 text-text-muted">—</td>
              <td className="px-3 py-3 text-text-muted">—</td>
              <td className="px-3 py-3 text-text-muted">—</td>
              <td className="px-3 py-3 text-text-muted">—</td>
              <td className="px-3 py-3 text-text-muted">—</td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-between gap-2 text-text-muted">
                  <span>—</span>
                  {onFolderMenu && (
                    <DotsButton onClick={(e) => { e.stopPropagation(); onFolderMenu(e, folder); }} />
                  )}
                </div>
              </td>
            </tr>
          ))}
          {files.map((f) => (
            <tr
              key={f.id}
              onContextMenu={(e) => onFileMenu(e, f)}
              onDoubleClick={() => onFileOpen(f)}
              title={t('documents.files.openHint')}
              className="group cursor-pointer select-none border-b border-card-border/60 transition-colors hover:bg-content-bg/50"
            >
              {/* w-full + max-w-0: cột tên chiếm phần còn lại, không banh hàng sang phải;
                  tên dài thì xuống dòng (break-words) thay vì cắt mất chữ */}
              <td className="w-full max-w-0 py-3 pr-3">
                <div className="flex items-start gap-3">
                  <FileIcon />
                  <div className="min-w-0 flex-1">
                    <p className="flex min-w-0 items-start gap-1.5 font-medium text-text">
                      <span className="break-words">{f.name}</span>
                      {f.warnning && <WarningIcon message={f.warnningMessage} />}
                    </p>
                    {f.description && <FileDescription text={f.description} />}
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-3">
                <span className="rounded-md bg-content-bg px-2 py-0.5 text-xs font-semibold text-text-secondary">
                  {f.displayVersion ?? `V${f.currentVersionNumber}`}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-text-secondary">{fileTypeLabel(f.fileType)}</td>
              <td className="whitespace-nowrap px-3 py-3">
                {(() => {
                  const badge = fileStatusBadge(f);
                  return (
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  );
                })()}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-text-secondary">{formatSize(f.sizeBytes)}</td>
              <td className="whitespace-nowrap px-3 py-3 text-text-secondary">{formatDate(f.updatedAt)}</td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-between gap-2 text-text-secondary">
                  <span className="truncate">{f.authorName ?? '—'}</span>
                  <DotsButton onClick={(e) => { e.stopPropagation(); onFileMenu(e, f); }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
