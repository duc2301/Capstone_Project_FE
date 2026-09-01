import { useEffect, useState } from 'react';

import { isForbiddenError } from '@/shared/api';
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
      .catch((err) => {
        // 403 = không phải nhóm sở hữu (và không phải Admin/PM) -> vẫn mở modal nhưng
        // hiện thông báo rõ nghĩa thay vì lỗi tải chung. Không có form/nút Lưu (vỏ modal
        // chỉ render trạng thái lỗi + nút Đóng khi chưa sẵn sàng).
        if (!cancelled) {
          setError(isForbiddenError(err) ? t('permission.assign.forbidden') : t('folderPermission.error'));
        }
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
