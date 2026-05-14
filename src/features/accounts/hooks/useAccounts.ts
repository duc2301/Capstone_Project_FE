import { useCallback, useEffect, useState } from 'react';

import type { Account, CreateAccountPayload, UpdateAccountPayload } from '../../../entities/account/model/account.types';
import { t } from '../../../shared/lib/i18n/translations';
import { accountApi } from '../../../entities/account/api/accountApi';

interface UseAccountsReturn {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  createAccount: (payload: CreateAccountPayload) => Promise<void>;
  updateAccount: (id: string, payload: UpdateAccountPayload) => Promise<void>;
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

  const createAccount = useCallback(async (payload: CreateAccountPayload) => {
    await accountApi.create(payload);
    await fetchAccounts();
  }, [fetchAccounts]);

  const updateAccount = useCallback(async (id: string, payload: UpdateAccountPayload) => {
    await accountApi.update(id, payload);
    await fetchAccounts();
  }, [fetchAccounts]);

  const deleteAccount = useCallback(async (id: string) => {
    await accountApi.remove(id);
    await fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { accounts, loading, error, fetchAccounts, createAccount, updateAccount, deleteAccount };
}
