import { useCallback, useEffect, useState } from 'react';

import type { FolderTreeNode } from '@/entities/folder';
import { folderApi } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

interface UseFolderTreeReturn {
  tree: FolderTreeNode[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFolderTree(projectId: string | undefined): UseFolderTreeReturn {
  const [tree, setTree] = useState<FolderTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dùng cho làm mới thủ công (gọi từ event handler, không phải trong effect).
  const refetch = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await folderApi.getTree(projectId);
      setTree(data.result ?? []);
    } catch {
      setError(t('documents.error'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Tải lần đầu / khi đổi dự án — setState chỉ chạy sau await để tránh cascading render.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await folderApi.getTree(projectId);
        if (!cancelled) setTree(data.result ?? []);
      } catch {
        if (!cancelled) setError(t('documents.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { tree, loading, error, refetch };
}
