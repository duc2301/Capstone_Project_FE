import { useCallback } from 'react';

import { folderApi } from '@/entities/folder';

/** Bọc các lời gọi API thao tác folder. Caller tự refetch + toast. */
export function useFolderActions() {
  const createSubFolder = useCallback(
    (parentFolderId: string, name: string) =>
      folderApi.createSubFolder({ parentFolderId, name }),
    [],
  );

  const renameFolder = useCallback(
    (id: string, name: string) => folderApi.update(id, { name }),
    [],
  );

  const moveFolder = useCallback(
    (id: string, parentFolderId: string) => folderApi.update(id, { parentFolderId }),
    [],
  );

  const deleteFolder = useCallback((id: string) => folderApi.remove(id), []);

  return { createSubFolder, renameFolder, moveFolder, deleteFolder };
}
