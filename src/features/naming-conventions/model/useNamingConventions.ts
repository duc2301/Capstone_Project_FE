import { useCallback } from 'react';

import type { NamingConvention } from '@/entities/naming-convention';
import { namingConventionApi } from '@/entities/naming-convention';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';

interface UseNamingConventionsReturn {
  conventions: NamingConvention[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Thay/chèn 1 convention từ response API — đỡ phải refetch cả danh sách sau mỗi thao tác. */
  upsert: (next: NamingConvention) => void;
}

const EMPTY_CONVENTIONS: NamingConvention[] = [];

export function useNamingConventions(projectId: string): UseNamingConventionsReturn {
  const fetchConventions = useCallback(async () => {
    const { data } = await namingConventionApi.getByProject(projectId);
    return sortByNewest(data.result ?? [], (c) => c.createdAt);
  }, [projectId]);

  const { data: conventions, loading, error, setData, reload } = useAsyncData(
    projectId,
    fetchConventions,
    {
      fallback: EMPTY_CONVENTIONS,
      toErrorMessage: () => t('naming.loadError'),
    },
  );

  const refetch = useCallback(async () => reload(), [reload]);

  const upsert = useCallback((next: NamingConvention) => {
    setData((prev) =>
      prev.some((c) => c.id === next.id)
        ? prev.map((c) => (c.id === next.id ? next : c))
        : [next, ...prev],
    );
  }, [setData]);

  return { conventions, loading, error, refetch, upsert };
}
