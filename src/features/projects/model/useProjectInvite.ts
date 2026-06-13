import { useCallback, useEffect, useState } from 'react';

import type { Account } from '@/entities/account';
import { accountApi } from '@/entities/account';
import { GroupMemberRole, invitationApi } from '@/entities/invitation';

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
        // Lỗi tải danh sách tài khoản — để trống, người dùng có thể mở lại modal.
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
    const failed = results.filter((r) => r.status === 'rejected').length;
    return { sent: input.accountIds.length - failed, failed };
  }, []);

  return { accounts, loading, inviteMany };
}
