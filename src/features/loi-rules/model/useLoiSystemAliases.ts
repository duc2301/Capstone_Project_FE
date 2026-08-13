import { useCallback, useMemo, useState } from 'react';

import type { CreateSystemLoiAliasPayload, LoiAlias } from '@/entities/loi-check';
import { loiRuleApi } from '@/entities/loi-check';
import { getApiErrorMessage } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

function unwrap<T>(payload: { isSuccess: boolean; message: string; result: T | null }): T {
  if (!payload.isSuccess || payload.result === null) throw new Error(payload.message);
  return payload.result;
}

export function useLoiSystemAliases() {
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: aliases, loading, error, reload } = useAsyncData<LoiAlias[]>(
    'loi-system-aliases',
    async () => {
      const { data } = await loiRuleApi.getSystemAliases();
      return unwrap(data);
    },
    {
      fallback: [],
      toErrorMessage: (err) => getApiErrorMessage(err, t('loiRule.error.loadAliases')),
    },
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return aliases;
    return aliases.filter(
      (alias) =>
        alias.paramNameInModel.toLowerCase().includes(query) ||
        alias.standardParamName.toLowerCase().includes(query),
    );
  }, [aliases, search]);

  const runMutation = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    setBusy(true);
    try {
      const result = await action();
      await reload();
      return result;
    } finally {
      setBusy(false);
    }
  }, [reload]);

  const createAlias = useCallback(
    (payload: CreateSystemLoiAliasPayload) =>
      runMutation(async () => {
        const { data } = await loiRuleApi.createSystemAlias(payload);
        return unwrap(data);
      }),
    [runMutation],
  );

  const deleteAlias = useCallback(
    (aliasId: string) => runMutation(() => loiRuleApi.deleteSystemAlias(aliasId)),
    [runMutation],
  );

  return { aliases, visible, loading, error, busy, search, setSearch, reload, createAlias, deleteAlias };
}
