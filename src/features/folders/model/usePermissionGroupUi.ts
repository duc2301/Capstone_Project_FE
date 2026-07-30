import { useEffect, useState } from 'react';

import { t } from '@/shared/lib/i18n';

import type { PermissionGroupUiData, PermissionGroupsLoader } from './permissionGroups.types';

interface UsePermissionGroupUiReturn {
  data: PermissionGroupUiData | null;
  loading: boolean;
  error: string | null;
}

/* Tải dữ liệu màn hình phân quyền của 1 tài nguyên (folder/file).
 * Modal phân quyền remount mỗi lần mở nên state khởi tạo (loading=true) là đủ,
 * không cần reset đồng bộ khi resourceId đổi. */
export function usePermissionGroupUi(
  resourceId: string,
  load: PermissionGroupsLoader,
): UsePermissionGroupUiReturn {
  const [data, setData] = useState<PermissionGroupUiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    load(resourceId)
      .then((result) => {
        if (!cancelled) setData(result);
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
  }, [resourceId, load]);

  return { data, loading, error };
}
