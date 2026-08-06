import { useCallback } from 'react';

import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

import { folderApi } from '../api/folderApi';
import { toFolderTreeNode } from './folder.mappers';
import type { FolderTreeNode } from './folder.types';

interface UseFolderTreeReturn {
  tree: FolderTreeNode[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const EMPTY_TREE: FolderTreeNode[] = [];

export function useFolderTree(projectId: string | undefined): UseFolderTreeReturn {
  const fetchTree = useCallback(async () => {
    const { data } = await folderApi.getTree(projectId!);
    return (data.result ?? []).map(toFolderTreeNode);
  }, [projectId]);

  const { data: tree, loading, error, reload } = useAsyncData(projectId ?? '', fetchTree, {
    fallback: EMPTY_TREE,
    enabled: Boolean(projectId),
    toErrorMessage: () => t('documents.error'),
  });

  const refetch = useCallback(async () => reload(), [reload]);

  return { tree, loading, error, refetch };
}
