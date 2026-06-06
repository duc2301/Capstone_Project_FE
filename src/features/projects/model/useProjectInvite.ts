import { useCallback, useEffect, useState } from 'react';

import type { Account } from '@/entities/account';
import { accountApi } from '@/entities/account';
import type { Group } from '@/entities/group';
import { groupApi } from '@/entities/group';
import { GroupMemberRole, invitationApi } from '@/entities/invitation';
import { projectApi } from '@/entities/project';

export interface InviteManyInput {
  projectId: string;
  groupId: string;
  accountIds: string[];
  leaderId: string;
  note?: string;
}

export interface InviteManyResult {
  sent: number;
  failed: number;
}

interface UseProjectInviteReturn {
  accounts: Account[];
  groups: Group[];
  loading: boolean;
  getProjectGroups: (projectId: string) => Promise<Group[]>;
  inviteMany: (input: InviteManyInput) => Promise<InviteManyResult>;
}

export function useProjectInvite(): UseProjectInviteReturn {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [accRes, grpRes] = await Promise.all([
          accountApi.getAll(),
          groupApi.getAll(),
        ]);
        if (cancelled) return;
        setAccounts(accRes.data.result ?? []);
        setGroups(grpRes.data.result ?? []);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getProjectGroups = useCallback(async (projectId: string): Promise<Group[]> => {
    const [partRes, grpRes] = await Promise.all([
      projectApi.getParticipants(projectId),
      groupApi.getAll(),
    ]);
    const groupIds = new Set((partRes.data.result ?? []).map((p) => p.groupId));
    return (grpRes.data.result ?? []).filter((g) => groupIds.has(g.id));
  }, []);

  const inviteMany = useCallback(async (input: InviteManyInput): Promise<InviteManyResult> => {
    const results = await Promise.allSettled(
      input.accountIds.map((accountId) =>
        invitationApi.invite({
          projectId: input.projectId,
          invitedGroupId: input.groupId,
          invitedAccountId: accountId,
          role: accountId === input.leaderId ? GroupMemberRole.Leader : GroupMemberRole.Member,
          note: input.note,
        }),
      ),
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    return { sent: input.accountIds.length - failed, failed };
  }, []);

  return { accounts, groups, loading, getProjectGroups, inviteMany };
}
