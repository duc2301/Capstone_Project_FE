import { useCallback, useEffect, useState } from 'react';

import { groupApi } from '@/entities/group';
import type {
  AssignManagerPayload,
  Project,
} from '@/entities/project';
import { projectApi, ProjectParticipantRole } from '@/entities/project';
import { isAccountAdmin, useSession } from '@/entities/session';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';

export interface ProjectGroupDraft {
  name: string;
  description?: string;
}

export interface CreateProjectWithGroupsInput {
  projectName: string;
  projectCode?: string;
  projectImage?: File | null;
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

  // Admin thấy toàn bộ dự án; người dùng thường gọi /projects/mine — BE đã lọc sẵn
  // theo nhóm tham gia hoặc vai trò PM. KHÔNG lọc ở client (tránh lộ danh sách dự án
  // của đơn vị khác qua network, và tránh N+1 request getParticipants cho từng dự án).
  const loadProjects = useCallback(async (): Promise<Project[]> => {
    const { data } = isAdmin ? await projectApi.getAll() : await projectApi.getMine();
    return sortByNewest(data.result ?? [], (p) => p.createdAt);
  }, [isAdmin]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await loadProjects());
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  const createProject = useCallback(async (input: CreateProjectWithGroupsInput) => {
    const { data: projectRes } = await projectApi.create({
      projectName: input.projectName,
      projectCode: input.projectCode,
      projectDescription: input.projectDescription,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
    });
    const project = projectRes.result;
    if (!project) throw new Error('Project creation failed');

    if (input.projectImage) await projectApi.uploadImage(project.id, input.projectImage);

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
        const result = await loadProjects();
        if (!cancelled) setProjects(result);
      } catch {
        if (!cancelled) setError(t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProjects]);

  return { projects, loading, error, fetchProjects, createProject, assignManager };
}
