import { useCallback, useEffect, useState } from "react";

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

/* Số tệp tối đa mỗi trang. Chỉ `files` bị phân trang; subfolders/hoistedFiles luôn trả đủ. */
export const FOLDER_FILES_PAGE_SIZE = 10;

interface UseFolderFilesReturn {
  /* Toàn bộ thư mục con (không phân trang). */
  subfolders: FolderTreeNode[];
  /* Một trang tệp của folder. */
  files: FileListItem[];
  /* Tệp cấp quyền riêng lẻ (không phân trang) — hiển thị sau danh sách files. */
  hoistedFiles: FileListItem[];
  /* Phân trang — CHỈ áp dụng cho `files`. */
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  setPage: (page: number) => void;
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
  hoistedFiles: FileListItem[];
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const EMPTY_CONTENTS: FolderContents = {
  subfolders: [],
  files: [],
  hoistedFiles: [],
  totalCount: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function useFolderFiles(folderId: string | null): UseFolderFilesReturn {
  const [page, setPage] = useState(1);

  // Mo folder khac -> ve trang 1. Dat lai NGAY trong render (truoc khi fetch) de tranh
  // fetch trang cu roi fetch lai trang 1.
  const [trackedFolder, setTrackedFolder] = useState(folderId);
  if (folderId !== trackedFolder) {
    setTrackedFolder(folderId);
    setPage(1);
  }

  const fetchContents = useCallback(async (): Promise<FolderContents> => {
    const { data } = await folderApi.getContents(folderId!, {
      page,
      pageSize: FOLDER_FILES_PAGE_SIZE,
    });
    const r = data.result;

    return {
      subfolders: (r?.subfolders ?? []).map(toFolderTreeNode),
      files: sortByNewest((r?.files ?? []).map(toFileListItem), (f) => f.createdAt),
      hoistedFiles: sortByNewest((r?.hoistedFiles ?? []).map(toFileListItem), (f) => f.createdAt),
      totalCount: r?.totalCount ?? 0,
      totalPages: Math.max(1, r?.totalPages ?? 1),
      hasNextPage: r?.hasNextPage ?? false,
      hasPreviousPage: r?.hasPreviousPage ?? false,
    };
  }, [folderId, page]);

  const { data, loading, error, setData, reload } = useAsyncData(
    `${folderId ?? ""}|${page}`,
    fetchContents,
    {
      fallback: EMPTY_CONTENTS,
      enabled: Boolean(folderId),
      toErrorMessage: () => t("documents.error"),
    },
  );

  const { subfolders, files, hoistedFiles, totalCount, totalPages, hasNextPage, hasPreviousPage } = data;

  // Trang hien tai vuot qua tong trang (vd file bi xoa lam giam so trang) -> lui ve trang cuoi.
  // Dat lai trong render (khong dung effect) de tranh cascading render; doi key -> tu fetch lai.
  // BE van tra subfolders/hoistedFiles day du nen KHONG duoc coi files rong la folder rong.
  if (!loading && page > totalPages) {
    setPage(totalPages);
  }

  // Ghep co "Dang xu ly issue" cho ca files (trang hien tai) lan hoistedFiles bang 1 loi goi
  // rieng (khong dong cham API cua FolderTreeService) — khong chan render, cap nhat sau khi co ket qua.
  const fileIdsKey = [...files, ...hoistedFiles].map((f) => f.id).join(",");
  useEffect(() => {
    if (!fileIdsKey) return;

    let cancelled = false;

    issueApi
      .getOpenIssueFileIds(fileIdsKey.split(","))
      .then((openIds) => {
        if (cancelled || openIds.length === 0) return;
        const openSet = new Set(openIds);
        const flag = (list: FileListItem[]) =>
          list.map((f) => (openSet.has(f.id) ? { ...f, hasOpenIssue: true } : f));
        setData((prev) => ({
          ...prev,
          files: flag(prev.files),
          hoistedFiles: flag(prev.hoistedFiles),
        }));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [fileIdsKey, setData]);

  const refetch = useCallback(async () => reload(), [reload]);

  return {
    subfolders,
    files,
    hoistedFiles,
    page: Math.min(page, totalPages),
    pageSize: FOLDER_FILES_PAGE_SIZE,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    setPage,
    loading,
    error,
    refetch,
  };
}
