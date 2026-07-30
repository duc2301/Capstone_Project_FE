import { useCallback, useEffect, useState } from 'react';

import type { Account, CreateAccountPayload, UpdateAccountPayload } from '@/entities/account';
import { accountApi } from '@/entities/account';
import { t } from '@/shared/lib/i18n';

interface UseAccountsReturn {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  createAccount: (payload: CreateAccountPayload, avatar?: File | null) => Promise<void>;
  updateAccount: (id: string, payload: UpdateAccountPayload, avatar?: File | null) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

export function useAccounts(): UseAccountsReturn {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await accountApi.getAll();
      setAccounts(data.result ?? []);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Ảnh đại diện cần id tài khoản nên phải upload SAU khi tạo/sửa xong.
  const createAccount = useCallback(async (payload: CreateAccountPayload, avatar?: File | null) => {
    const { data } = await accountApi.create(payload);
    const created = data.result;

    if (avatar && created) {
      try {
        await accountApi.uploadAvatar(created.id, avatar);
      } catch {
        // Tài khoản ĐÃ tạo xong rồi; báo rõ để admin khỏi bấm tạo lại (sẽ trùng email).
        await fetchAccounts();
        throw new Error(t('account.avatar.uploadFailedAfterCreate'));
      }
    }

    await fetchAccounts();
  }, [fetchAccounts]);

  const updateAccount = useCallback(async (id: string, payload: UpdateAccountPayload, avatar?: File | null) => {
    await accountApi.update(id, payload);
    if (avatar) await accountApi.uploadAvatar(id, avatar);
    await fetchAccounts();
  }, [fetchAccounts]);

  const deleteAccount = useCallback(async (id: string) => {
    await accountApi.remove(id);
    await fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await accountApi.getAll();
        if (!cancelled) setAccounts(data.result ?? []);
      } catch {
        if (!cancelled) setError(t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { accounts, loading, error, fetchAccounts, createAccount, updateAccount, deleteAccount };
}
