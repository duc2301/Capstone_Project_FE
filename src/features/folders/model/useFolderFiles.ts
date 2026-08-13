import { useCallback, useEffect } from "react";

import type {
  FileListItem,
  FileItemStatus,
  FileType,
} from "@/entities/file-item";
import type { FolderContentsFileDto, FolderTreeNode } from "@/entities/folder";
import { folderApi, toFolderTreeNode } from "@/entities/folder";
import { issueApi } from "@/entities/issue";
import { useAsyncData } from "@/shared/lib/async";
import { t } from "@/shared/lib/i18n";
import { sortByNewest } from "@/shared/lib/sort";

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
    format: dto.format ?? null,
    createdByAccountId: null,
    currentVersionUploadedByAccountId: dto.uploadedByAccountId ?? null,
    authorName: dto.uploaderEmail,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    warnning: dto.warnning,
    warnningMessage: dto.warnningMessage,
    description: dto.description ?? null,
    hasOpenIssue: dto.hasOpenIssue,
  };
}

interface FolderContents {
  subfolders: FolderTreeNode[];
  files: FileListItem[];
}

const EMPTY_CONTENTS: FolderContents = { subfolders: [], files: [] };

export function useFolderFiles(folderId: string | null): UseFolderFilesReturn {
  const fetchContents = useCallback(async (): Promise<FolderContents> => {
    const { data } = await folderApi.getContents(folderId!);

    return {
      subfolders: (data.result?.subfolders ?? []).map(toFolderTreeNode),
      files: sortByNewest((data.result?.files ?? []).map(toFileListItem), (f) => f.createdAt),
    };
  }, [folderId]);

  const { data, loading, error, setData, reload } = useAsyncData(folderId ?? "", fetchContents, {
    fallback: EMPTY_CONTENTS,
    enabled: Boolean(folderId),
    toErrorMessage: () => t("documents.error"),
  });

  const { subfolders, files } = data;
  const fileIdsKey = files.map((f) => f.id).join(",");

  // Ghep co "Dang xu ly issue" bang 1 loi goi rieng (khong dong cham API cua FolderTreeService) —
  // khong chan render danh sach file, cap nhat sau khi co ket qua.
  useEffect(() => {
    if (!fileIdsKey) return;

    let cancelled = false;

    issueApi
      .getOpenIssueFileIds(fileIdsKey.split(","))
      .then((openIds) => {
        if (cancelled || openIds.length === 0) return;
        const openSet = new Set(openIds);
        setData((prev) => ({
          ...prev,
          files: prev.files.map((f) => (openSet.has(f.id) ? { ...f, hasOpenIssue: true } : f)),
        }));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [fileIdsKey, setData]);

  const refetch = useCallback(async () => reload(), [reload]);

  return { subfolders, files, loading, error, refetch };
}
