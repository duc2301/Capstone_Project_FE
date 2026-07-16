import { useState } from 'react';

import type { FileListItem } from '@/entities/file-item';
import { useFolderTree } from '@/features/folders/model/useFolderTree';
import { useFolderFiles } from '@/features/folders/model/useFolderFiles';
import { FolderTree } from '@/features/folders/ui/FolderTree';
import { t } from '@/shared/lib/i18n';

interface AttachExistingFilePickerProps {
  projectId: string;
  onClose: () => void;
  onSelect: (file: FileListItem) => void;
}

export function AttachExistingFilePicker({ projectId, onClose, onSelect }: AttachExistingFilePickerProps) {
  const { tree } = useFolderTree(projectId);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { files, loading } = useFolderFiles(selectedFolderId);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl animate-scale-in flex-col overflow-hidden rounded-(--radius-card-lg) bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-text">{t('issues.attach.pickerTitle')}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[260px_1fr] gap-4 overflow-hidden p-6">
          <div className="overflow-y-auto">
            <FolderTree tree={tree} selectedId={selectedFolderId} onSelect={(node) => setSelectedFolderId(node.id)} />
          </div>

          <div className="overflow-y-auto rounded-(--radius-card) border border-card-border">
            {!selectedFolderId ? (
              <p className="p-6 text-center text-sm text-text-muted">{t('issues.attach.pickFolderFirst')}</p>
            ) : loading ? (
              <p className="p-6 text-center text-sm text-text-muted">{t('common.loading')}</p>
            ) : files.length === 0 ? (
              <p className="p-6 text-center text-sm text-text-muted">{t('issues.attach.folderEmpty')}</p>
            ) : (
              <ul className="divide-y divide-card-border">
                {files.map((file) => (
                  <li key={file.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(file)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-content-bg"
                    >
                      <span className="truncate font-medium text-text">{file.name}</span>
                      <span className="shrink-0 text-xs font-semibold uppercase text-text-muted">{file.format ?? ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
