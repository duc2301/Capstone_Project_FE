import { useCallback, useEffect, useState } from 'react';

import type { Account } from '@/entities/account';
import { accountApi } from '@/entities/account';
import { GroupMemberRole, invitationApi } from '@/entities/invitation';
import { getApiErrorMessage } from '@/shared/api';

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
  errorMessage?: string;
}

interface UseProjectInviteReturn {
  accounts: Account[];
  loading: boolean;
  inviteMany: (input: InviteManyInput) => Promise<InviteManyResult>;
}

export function useProjectInvite(): UseProjectInviteReturn {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accRes = await accountApi.getAll();
        if (!cancelled) setAccounts(accRes.data.result ?? []);
      } catch {
        console.error('Failed to fetch accounts');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
    const failures = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );
    const errorMessage =
      failures.length > 0 ? getApiErrorMessage(failures[0].reason, '') : '';
    return {
      sent: input.accountIds.length - failures.length,
      failed: failures.length,
      errorMessage: errorMessage || undefined,
    };
  }, []);

  return { accounts, loading, inviteMany };
}
