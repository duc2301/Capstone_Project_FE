import { useCallback, useEffect, useState } from 'react';

import { t } from '@/shared/lib/i18n';

import type { PermissionUserUiData, PermissionUsersLoader } from './permissionUsers.types';

interface UsePermissionUserUiReturn {
  data: PermissionUserUiData | null;
  loading: boolean;
  error: string | null;
  /** Tải lại dữ liệu — gọi sau khi lưu để 2 panel phản ánh trạng thái override mới. */
  reload: () => void;
  /** Tăng mỗi lần tải xong — dùng làm key để remount phần thân với dữ liệu mới. */
  version: number;
}

/* Tải dữ liệu màn hình phân quyền thành viên của 1 tài nguyên (folder/file).
 * Khác modal phân quyền nhóm ở chỗ có `reload`: sau khi lưu, cách xử lý gọn nhất
 * theo hợp đồng API là tải lại user-ui để làm mới cả 2 panel. */
export function usePermissionUserUi(
  resourceId: string,
  load: PermissionUsersLoader,
): UsePermissionUserUiReturn {
  const [data, setData] = useState<PermissionUserUiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setReloadTrigger((n) => n + 1), []);

  // Không set loading=true khi tải lại (sau khi lưu): giữ nguyên phần thân đang hiển thị,
  // chỉ khi dữ liệu mới về mới bump version để remount panel -> không nhấp nháy màn tải.
  useEffect(() => {
    let cancelled = false;

    load(resourceId)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
          setVersion((v) => v + 1);
        }
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
  }, [resourceId, load, reloadTrigger]);

  return { data, loading, error, reload, version };
}
