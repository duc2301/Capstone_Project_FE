import { useCallback, useEffect, useState } from 'react';

import { groupApi, GroupMemberStatus } from '@/entities/group';
import { ProjectParticipantStatus, projectApi } from '@/entities/project';

export interface ProjectMember {
  accountId: string;
  userName: string;
  email?: string | null;
  groupId: string;
  groupName: string;
}

interface UseProjectMembersReturn {
  members: ProjectMember[];
  loading: boolean;
}

/* Nguoi trong 1 du an = hop cac GroupMember (con Active) cua cac group ma du an co tham gia
 * (ProjectParticipant lien ket Project <-> Group, khong phai truc tiep toi account).
 * Giu rieng tung dong theo (account, group) — khong gop lai — de FE hien ro "ai o nhom nao",
 * vi 1 nguoi co the thuoc nhieu nhom trong cung du an. */
export function useProjectMembers(projectId: string | undefined): UseProjectMembersReturn {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (isCancelled: () => boolean = () => false) => {
    if (!projectId) return;

    setLoading(true);
    try {
      const [{ data: participantsRes }, { data: groupsRes }] = await Promise.all([
        projectApi.getParticipants(projectId),
        groupApi.getAll(),
      ]);
      if (isCancelled()) return;

      const activeGroupIds = new Set(
        (participantsRes.result ?? [])
          .filter((p) => p.status === ProjectParticipantStatus.Active)
          .map((p) => p.groupId),
      );

      const result: ProjectMember[] = [];
      for (const group of groupsRes.result ?? []) {
        if (!activeGroupIds.has(group.id)) continue;
        for (const member of group.members) {
          if (member.status !== GroupMemberStatus.Active) continue;
          result.push({
            accountId: member.accountId,
            userName: member.userName,
            email: member.email,
            groupId: group.id,
            groupName: group.name,
          });
        }
      }

      result.sort((a, b) => a.groupName.localeCompare(b.groupName) || a.userName.localeCompare(b.userName));
      setMembers(result);
    } catch {
      if (!isCancelled()) setMembers([]);
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    void load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { members, loading };
}
