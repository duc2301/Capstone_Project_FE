import { useCallback, useEffect, useState } from 'react';

import type { AssignManagerPayload, Project } from '@/entities/project';
import { projectApi } from '@/entities/project';
import { t } from '@/shared/lib/i18n';

interface UseProjectDetailReturn {
  project: Project | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  assignManager: (payload: AssignManagerPayload) => Promise<void>;
}

export function useProjectDetail(projectId: string | undefined): UseProjectDetailReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await projectApi.getById(projectId);
      setProject(data.result ?? null);
      if (!data.result) setError(t('common.error'));
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await projectApi.getById(projectId);
        if (cancelled) return;
        setProject(data.result ?? null);
        if (!data.result) setError(t('common.error'));
      } catch {
        if (!cancelled) setError(t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const assignManager = useCallback(
    async (payload: AssignManagerPayload) => {
      if (!projectId) return;
      await projectApi.assignManager(projectId, payload);
      await load();
    },
    [projectId, load],
  );

  return { project, loading, error, refresh: load, assignManager };
}
