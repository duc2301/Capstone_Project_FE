import { useCallback, useEffect, useState } from 'react';

import type { RelatedFile } from '@/entities/file-item';
import { fileItemApi } from '@/entities/file-item';
import { t } from '@/shared/lib/i18n';

interface UseRelatedFilesReturn {
  relatedFiles: RelatedFile[];
  canLink: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  addLinks: (relatedFileItemIds: string[]) => Promise<boolean>;
  removeLink: (linkedFileItemId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

interface LoadedRelatedFiles {
  fileItemId: string;
  files: RelatedFile[];
  canLink: boolean;
  error: string | null;
}

async function fetchRelatedFiles(fileItemId: string): Promise<LoadedRelatedFiles> {
  try {
    const { data } = await fileItemApi.getRelatedFiles(fileItemId);
    return data.isSuccess && data.result
      ? { fileItemId, files: data.result.files ?? [], canLink: data.result.canLink, error: null }
      : { fileItemId, files: [], canLink: false, error: t('relatedFiles.error') };
  } catch {
    return { fileItemId, files: [], canLink: false, error: t('relatedFiles.error') };
  }
}

export function useRelatedFiles(fileItemId: string | null): UseRelatedFilesReturn {
  const [loaded, setLoaded] = useState<LoadedRelatedFiles | null>(null);
  const [saving, setSaving] = useState(false);

  const refetch = useCallback(async () => {
    if (!fileItemId) return;
    setLoaded(await fetchRelatedFiles(fileItemId));
  }, [fileItemId]);

  const failWith = useCallback(
    (message: string) =>
      setLoaded((prev) => ({
        fileItemId: fileItemId!,
        files: prev?.fileItemId === fileItemId ? prev.files : [],
        canLink: prev?.fileItemId === fileItemId ? prev.canLink : false,
        error: message,
      })),
    [fileItemId],
  );

  const addLinks = useCallback(
    async (relatedFileItemIds: string[]) => {
      if (!fileItemId || relatedFileItemIds.length === 0) return false;

      setSaving(true);
      try {
        const { data } = await fileItemApi.addRelatedFiles(fileItemId, relatedFileItemIds);
        if (!data.isSuccess || !data.result) {
          failWith(t('relatedFiles.addError'));
          return false;
        }
        setLoaded({ fileItemId, files: data.result.files ?? [], canLink: data.result.canLink, error: null });
        return true;
      } catch {
        failWith(t('relatedFiles.addError'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fileItemId, failWith],
  );

  const removeLink = useCallback(
    async (linkedFileItemId: string) => {
      if (!fileItemId) return false;

      setSaving(true);
      try {
        const { data } = await fileItemApi.removeRelatedFile(fileItemId, linkedFileItemId);
        if (!data.isSuccess) {
          failWith(t('relatedFiles.removeError'));
          return false;
        }
        setLoaded((prev) => ({
          fileItemId,
          files: prev?.fileItemId === fileItemId ? prev.files.filter((f) => f.id !== linkedFileItemId) : [],
          canLink: prev?.fileItemId === fileItemId ? prev.canLink : false,
          error: null,
        }));
        return true;
      } catch {
        failWith(t('relatedFiles.removeError'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [fileItemId, failWith],
  );

  useEffect(() => {
    if (!fileItemId) return;

    let cancelled = false;
    void fetchRelatedFiles(fileItemId).then((result) => {
      if (!cancelled) setLoaded(result);
    });

    return () => {
      cancelled = true;
    };
  }, [fileItemId]);

  const current = loaded?.fileItemId === fileItemId ? loaded : null;

  return {
    relatedFiles: current?.files ?? [],
    canLink: current?.canLink ?? false,
    loading: fileItemId !== null && current === null,
    saving,
    error: current?.error ?? null,
    addLinks,
    removeLink,
    refetch,
  };
}
