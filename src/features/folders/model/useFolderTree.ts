import { useCallback, useEffect, useState } from 'react';

import type { FolderTreeNode } from '@/entities/folder';
import { folderApi, toFolderTreeNode } from '@/entities/folder';
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

  const loadTree = useCallback(async (
    showLoading: boolean,
    isCancelled: () => boolean = () => false,
  ) => {
    if (!projectId) return;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const { data } = await folderApi.getTree(projectId);
      if (!isCancelled()) setTree((data.result ?? []).map(toFolderTreeNode));
    } catch {
      if (!isCancelled()) setError(t('documents.error'));
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [projectId]);

  // Manual refresh keeps the current tree visible to avoid flashing the whole Documents tab.
  const refetch = useCallback(() => loadTree(false), [loadTree]);

  useEffect(() => {
    if (!projectId) {
      setTree([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void loadTree(true, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [projectId, loadTree]);

  return { tree, loading, error, refetch };
}
