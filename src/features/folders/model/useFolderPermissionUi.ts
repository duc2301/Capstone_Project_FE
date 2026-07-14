import { useEffect, useState } from 'react';

import type { FolderPermissionUiDto } from '@/entities/folder';
import { folderApi } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

interface UseFolderPermissionUiReturn {
  data: FolderPermissionUiDto | null;
  loading: boolean;
  error: string | null;
}

/* Tải dữ liệu màn hình phân quyền thư mục (GET /folders/{id}/group-ui).
 * Modal phân quyền remount mỗi lần mở nên state khởi tạo (loading=true) là đủ,
 * không cần reset đồng bộ khi folderId đổi. */
export function useFolderPermissionUi(folderId: string): UseFolderPermissionUiReturn {
  const [data, setData] = useState<FolderPermissionUiDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    folderApi
      .getGroupUi(folderId)
      .then(({ data }) => {
        if (!cancelled)
          setData(data.result ?? { availableGroups: [], selectedPermissions: [] });
      })
      .catch(() => {
        if (!cancelled) setError(t('folderPermission.error'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [folderId]);

  return { data, loading, error };
}
