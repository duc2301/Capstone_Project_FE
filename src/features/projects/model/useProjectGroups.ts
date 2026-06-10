import { useCallback, useEffect, useState } from 'react';

import type { Group } from '@/entities/group';
import { groupApi } from '@/entities/group';
import { projectApi, ProjectParticipantRole } from '@/entities/project';
import { t } from '@/shared/lib/i18n';

export interface AddGroupInput {
  name: string;
  description?: string;
}

interface UseProjectGroupsReturn {
  groups: Group[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addGroup: (input: AddGroupInput) => Promise<void>;
}

export function useProjectGroups(projectId: string | undefined): UseProjectGroupsReturn {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [partRes, grpRes] = await Promise.all([
        projectApi.getParticipants(projectId),
        groupApi.getAll(),
      ]);
      const groupIds = new Set((partRes.data.result ?? []).map((p) => p.groupId));
      setGroups((grpRes.data.result ?? []).filter((g) => groupIds.has(g.id)));
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
        const [partRes, grpRes] = await Promise.all([
          projectApi.getParticipants(projectId),
          groupApi.getAll(),
        ]);
        if (cancelled) return;
        const groupIds = new Set((partRes.data.result ?? []).map((p) => p.groupId));
        setGroups((grpRes.data.result ?? []).filter((g) => groupIds.has(g.id)));
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

  const addGroup = useCallback(
    async (input: AddGroupInput) => {
      if (!projectId) return;
      const { data } = await groupApi.create({
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
      });
      const groupId = data.result?.id;
      if (groupId) {
        await projectApi.addParticipantsBulk(projectId, {
          participants: [{ groupId, role: ProjectParticipantRole.Member }],
        });
      }
      await load();
    },
    [projectId, load],
  );

  return { groups, loading, error, refresh: load, addGroup };
}
