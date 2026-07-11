import { useCallback, useEffect, useState } from 'react';

import type { FileListItem, FileItemStatus, FileType } from '@/entities/file-item';
import type { FolderContentsFileDto, FolderTreeNode } from '@/entities/folder';
import { folderApi, toFolderTreeNode } from '@/entities/folder';
import { issueApi } from '@/entities/issue';
import { t } from '@/shared/lib/i18n';

interface UseFolderFilesReturn {
  subfolders: FolderTreeNode[];
  files: FileListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/* API /folder-tree/folders/{id}/contents chưa trả size/format/version/author —
 * tạm điền mặc định để FileList hiện tại render được. Sẽ gỡ khi BE trả đủ. */
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
    sizeBytes: 0,
    format: null,
    createdByAccountId: null,
    authorName: null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    hasOpenIssue: false,
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
      if (isCancelled()) return;

      setSubfolders((data.result?.subfolders ?? []).map(toFolderTreeNode));
      const items = (data.result?.files ?? []).map(toFileListItem);
      setFiles(items);

      // Ghep co "Dang xu ly issue" bang 1 loi goi rieng (khong dong cham API cua FolderTreeService) —
      // khong chan render danh sach file, cap nhat sau khi co ket qua.
      if (items.length > 0) {
        issueApi.getOpenIssueFileIds(items.map((f) => f.id))
          .then((openIds) => {
            if (isCancelled() || openIds.length === 0) return;
            const openSet = new Set(openIds);
            setFiles((prev) => prev.map((f) => (openSet.has(f.id) ? { ...f, hasOpenIssue: true } : f)));
          })
          .catch(() => undefined);
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
