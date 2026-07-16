import { useCallback, useEffect, useState } from 'react';

import type { FileListItem, FileItemStatus, FileType } from '@/entities/file-item';
import type { FolderContentsFileDto, FolderTreeNode } from '@/entities/folder';
import { folderApi, toFolderTreeNode } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

interface UseFolderFilesReturn {
  subfolders: FolderTreeNode[];
  files: FileListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function toFileListItem(dto: FolderContentsFileDto): FileListItem {
  return {
    id: dto.id,
    folderId: dto.folderId,
    name: dto.name,
    fileType: dto.fileType as FileType,
    status: dto.status as FileItemStatus,
    returnRequestStatus: null,
    returnTargetZone: null,
    currentVersionId: dto.currentVersionId,
    currentVersionNumber: 1,
    displayVersion: dto.displayVersion,
    sizeBytes: dto.fileSizeBytes,
    format: null,
    createdByAccountId: null,
    authorName: dto.uploaderEmail,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    warnning: dto.warnning,
    warnningMessage: dto.warnningMessage,
    hasOpenIssue: dto.hasOpenIssue,
  };
}

export function useFolderFiles(folderId: string | null): UseFolderFilesReturn {
  const [subfolders, setSubfolders] = useState<FolderTreeNode[]>([]);
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async (showLoading: boolean, isCancelled: () => boolean = () => false) => {
    if (!folderId) return;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const { data } = await folderApi.getContents(folderId);
      if (!isCancelled()) {
        setSubfolders((data.result?.subfolders ?? []).map(toFolderTreeNode));
        setFiles((data.result?.files ?? []).map(toFileListItem));
      }
    } catch {
      if (!isCancelled()) setError(t('documents.error'));
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [folderId]);

  const refetch = useCallback(() => loadFiles(false), [loadFiles]);

  useEffect(() => {
    if (!folderId) {
      setSubfolders([]);
      setFiles([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void loadFiles(true, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [folderId, loadFiles]);

  return { subfolders, files, loading, error, refetch };
}
