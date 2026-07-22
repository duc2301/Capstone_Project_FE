import { useEffect, useState } from 'react';

import type { LinkableFile } from '@/entities/file-item';
import { fileItemApi } from '@/entities/file-item';
import { t } from '@/shared/lib/i18n';

interface UseLinkableFilesReturn {
  linkableFiles: LinkableFile[];
  loading: boolean;
  error: string | null;
}

interface LoadedLinkableFiles {
  key: string;
  files: LinkableFile[];
  error: string | null;
}

function cacheKeyOf(folderId: string, excludeFileItemId?: string): string {
  return `${folderId}|${excludeFileItemId ?? ''}`;
}

async function fetchLinkableFiles(
  folderId: string,
  excludeFileItemId?: string,
): Promise<LoadedLinkableFiles> {
  const key = cacheKeyOf(folderId, excludeFileItemId);
  try {
    const { data } = await fileItemApi.getLinkableFiles(folderId, excludeFileItemId);
    return data.isSuccess
      ? { key, files: data.result ?? [], error: null }
      : { key, files: [], error: t('relatedFiles.pickerError') };
  } catch {
    return { key, files: [], error: t('relatedFiles.pickerError') };
  }
}

export function useLinkableFiles(
  folderId: string | null,
  excludeFileItemId?: string,
): UseLinkableFilesReturn {
  const [loaded, setLoaded] = useState<LoadedLinkableFiles | null>(null);

  useEffect(() => {
    if (!folderId) return;

    let cancelled = false;
    void fetchLinkableFiles(folderId, excludeFileItemId).then((result) => {
      if (!cancelled) setLoaded(result);
    });

    return () => {
      cancelled = true;
    };
  }, [folderId, excludeFileItemId]);

  const current = folderId && loaded?.key === cacheKeyOf(folderId, excludeFileItemId) ? loaded : null;

  return {
    linkableFiles: current?.files ?? [],
    loading: folderId !== null && current === null,
    error: current?.error ?? null,
  };
}
