import { useCallback, useEffect, useState } from 'react';

import type { Group } from '@/entities/group';
import { groupApi } from '@/entities/group';
import { projectApi, ProjectParticipantRole, ProjectParticipantStatus } from '@/entities/project';
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
  removeGroup: (groupId: string) => Promise<void>;
}

function activeGroups(participants: { groupId: string; status: number }[], groups: Group[]): Group[] {
  const activeIds = new Set(
    participants
      .filter((p) => p.status === ProjectParticipantStatus.Active)
      .map((p) => p.groupId),
  );
  return groups.filter((g) => activeIds.has(g.id));
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
      setGroups(activeGroups(partRes.data.result ?? [], grpRes.data.result ?? []));
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
        setGroups(activeGroups(partRes.data.result ?? [], grpRes.data.result ?? []));
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

  const removeGroup = useCallback(
    async (groupId: string) => {
      if (!projectId) return;
      await projectApi.updateParticipantStatus(projectId, groupId, {
        status: ProjectParticipantStatus.Inactive,
      });
      await load();
    },
    [projectId, load],
  );

  return { groups, loading, error, refresh: load, addGroup, removeGroup };
}
