import { useCallback, useEffect, useState } from 'react';

import type { FileListItem } from '@/entities/file-item';
import { fileItemApi } from '@/entities/file-item';
import { t } from '@/shared/lib/i18n';

interface UseFolderFilesReturn {
  files: FileListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFolderFiles(folderId: string | null): UseFolderFilesReturn {
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async (showLoading: boolean, isCancelled: () => boolean = () => false) => {
    if (!folderId) return;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const { data } = await fileItemApi.getByFolder(folderId);
      if (!isCancelled()) setFiles(data.result ?? []);
    } catch {
      if (!isCancelled()) setError(t('documents.error'));
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [folderId]);

  const refetch = useCallback(() => loadFiles(false), [loadFiles]);

  useEffect(() => {
    if (!folderId) {
      setFiles([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void loadFiles(true, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [folderId, loadFiles]);

  return { files, loading, error, refetch };
}
