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

/* Danh sách file của 1 folder. Component nên đặt key={folderId} để remount khi đổi folder. */
export function useFolderFiles(folderId: string | null): UseFolderFilesReturn {
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await fileItemApi.getByFolder(folderId);
      setFiles(data.result ?? []);
    } catch {
      setError(t('documents.error'));
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    if (!folderId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await fileItemApi.getByFolder(folderId);
        if (!cancelled) setFiles(data.result ?? []);
      } catch {
        if (!cancelled) setError(t('documents.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folderId]);

  return { files, loading, error, refetch };
}
