import { useCallback, useEffect, useState } from 'react';

import type { NamingConvention } from '@/entities/naming-convention';
import { namingConventionApi } from '@/entities/naming-convention';
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

export function useNamingConventions(projectId: string): UseNamingConventionsReturn {
  const [conventions, setConventions] = useState<NamingConvention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (showLoading: boolean, isCancelled: () => boolean = () => false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const { data } = await namingConventionApi.getByProject(projectId);
      if (isCancelled()) return;
      setConventions(sortByNewest(data.result ?? [], (c) => c.createdAt));
    } catch {
      if (!isCancelled()) setError(t('naming.loadError'));
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void load(true, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  const refetch = useCallback(() => load(false), [load]);

  const upsert = useCallback((next: NamingConvention) => {
    setConventions((prev) =>
      prev.some((c) => c.id === next.id)
        ? prev.map((c) => (c.id === next.id ? next : c))
        : [next, ...prev],
    );
  }, []);

  return { conventions, loading, error, refetch, upsert };
}
