import { useCallback, useMemo, useState } from 'react';

import type { CreateLoiAliasPayload, LoiAlias } from '@/entities/loi-check';
import { loiAliasApi } from '@/entities/loi-check';
import { getApiErrorMessage } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

export function useProjectLoiAliases(projectId: string | undefined) {
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: aliases, loading, error, reload } = useAsyncData<LoiAlias[]>(
    `project-loi-aliases:${projectId ?? ''}`,
    async () => {
      if (!projectId) return [];
      const { data } = await loiAliasApi.getByProject(projectId);
      if (!data.isSuccess || !data.result) throw new Error(data.message);
      return data.result;
    },
    {
      fallback: [],
      enabled: Boolean(projectId),
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
    (payload: CreateLoiAliasPayload) =>
      runMutation(async () => {
        if (!projectId) throw new Error(t('loiRule.error.noRuleSet'));
        const { data } = await loiAliasApi.create(projectId, payload);
        if (!data.isSuccess || !data.result) throw new Error(data.message);
        return data.result;
      }),
    [projectId, runMutation],
  );

  const deleteAlias = useCallback(
    (aliasId: string) =>
      runMutation(() => {
        if (!projectId) throw new Error(t('loiRule.error.noRuleSet'));
        return loiAliasApi.remove(projectId, aliasId);
      }),
    [projectId, runMutation],
  );

  return { aliases, visible, loading, error, busy, search, setSearch, reload, createAlias, deleteAlias };
}
