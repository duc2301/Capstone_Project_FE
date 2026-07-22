import { useCallback, useEffect, useState } from 'react';

import { groupApi } from '@/entities/group';
import type {
  AssignManagerPayload,
  Project,
} from '@/entities/project';
import { projectApi, ProjectParticipantRole } from '@/entities/project';
import { isAccountAdmin, useSession } from '@/entities/session';
import { t } from '@/shared/lib/i18n';

export interface ProjectGroupDraft {
  name: string;
  description?: string;
}

export interface CreateProjectWithGroupsInput {
  projectName: string;
  projectCode?: string;
  projectImageUrl?: string;
  projectDescription?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  groups: ProjectGroupDraft[];
}

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (input: CreateProjectWithGroupsInput) => Promise<void>;
  assignManager: (projectId: string, payload: AssignManagerPayload) => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const { currentUser } = useSession();
  const isAdmin = isAccountAdmin(currentUser?.role);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await projectApi.getAll();
      let allProjects = data.result ?? [];

      if (!isAdmin && currentUser) {
        const { data: grpData } = await groupApi.getAll();
        const groups = grpData.result ?? [];
        const myGroupIds = new Set(
          groups
            .filter((g) => g.members.some((m) => m.accountId === currentUser.accountId))
            .map((g) => g.id)
        );

        const participantsPromises = allProjects.map((p) =>
          projectApi.getParticipants(p.id).catch(() => null)
        );
        const participantsResults = await Promise.all(participantsPromises);

        allProjects = allProjects.filter((p, index) => {
          if (p.managerAccountId === currentUser.accountId) return true;
          const participants = participantsResults[index]?.data?.result ?? [];
          return participants.some((part) => myGroupIds.has(part.groupId));
        });
      }

      setProjects(allProjects);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, currentUser]);

  const createProject = useCallback(async (input: CreateProjectWithGroupsInput) => {
    const { data: projectRes } = await projectApi.create({
      projectName: input.projectName,
      projectCode: input.projectCode,
      projectImageUrl: input.projectImageUrl,
      projectDescription: input.projectDescription,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
    });
    const project = projectRes.result;
    if (!project) throw new Error('Project creation failed');

    const groups = input.groups.filter((g) => g.name.trim());
    if (groups.length > 0) {
      const created = await Promise.all(
        groups.map((g) =>
          groupApi.create({ name: g.name.trim(), description: g.description?.trim() || undefined }),
        ),
      );
      const groupIds = created
        .map((res) => res.data.result?.id)
        .filter((id): id is string => Boolean(id));

      if (groupIds.length > 0) {
        await projectApi.addParticipantsBulk(project.id, {
          participants: groupIds.map((groupId) => ({
            groupId,
            role: ProjectParticipantRole.Member,
          })),
        });
      }
    }

    await fetchProjects();
  }, [fetchProjects]);

  const assignManager = useCallback(async (projectId: string, payload: AssignManagerPayload) => {
    await projectApi.assignManager(projectId, payload);
    await fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await projectApi.getAll();
        let allProjects = data.result ?? [];

        if (!isAdmin && currentUser) {
          const { data: grpData } = await groupApi.getAll();
          const groups = grpData.result ?? [];
          const myGroupIds = new Set(
            groups
              .filter((g) => g.members.some((m) => m.accountId === currentUser.accountId))
              .map((g) => g.id)
          );

          const participantsPromises = allProjects.map((p) =>
            projectApi.getParticipants(p.id).catch(() => null)
          );
          const participantsResults = await Promise.all(participantsPromises);

          allProjects = allProjects.filter((p, index) => {
            if (p.managerAccountId === currentUser.accountId) return true;
            const participants = participantsResults[index]?.data?.result ?? [];
            return participants.some((part) => myGroupIds.has(part.groupId));
          });
        }

        if (!cancelled) setProjects(allProjects);
      } catch {
        if (!cancelled) setError(t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, currentUser]);

  return { projects, loading, error, fetchProjects, createProject, assignManager };
}
