import { useCallback, useState } from 'react';

import type { CreateLoiRuleSetPayload, LoiRuleSet, UpdateLoiRuleSetPayload } from '@/entities/loi-check';
import { loiRuleApi } from '@/entities/loi-check';
import { getApiErrorMessage } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

function unwrap<T>(payload: { isSuccess: boolean; message: string; result: T | null }): T {
  if (!payload.isSuccess || payload.result === null) throw new Error(payload.message);
  return payload.result;
}

export function useLoiRuleSets() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: ruleSets, loading, error, reload } = useAsyncData<LoiRuleSet[]>(
    'loi-rule-sets',
    async () => {
      const { data } = await loiRuleApi.getRuleSets();
      return unwrap(data);
    },
    {
      fallback: [],
      toErrorMessage: (err) => getApiErrorMessage(err, t('loiRule.error.loadRuleSets')),
    },
  );

  const selected =
    ruleSets.find((item) => item.id === selectedId) ??
    ruleSets.find((item) => item.isDefault) ??
    ruleSets[0] ??
    null;

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

  const createRuleSet = useCallback(async (payload: CreateLoiRuleSetPayload) => {
    const created = await runMutation(async () => {
      const { data } = await loiRuleApi.createRuleSet(payload);
      return unwrap(data);
    });
    setSelectedId(created.id);
    return created;
  }, [runMutation]);

  const updateRuleSet = useCallback(
    (ruleSetId: string, payload: UpdateLoiRuleSetPayload) =>
      runMutation(async () => {
        const { data } = await loiRuleApi.updateRuleSet(ruleSetId, payload);
        return unwrap(data);
      }),
    [runMutation],
  );

  const deleteRuleSet = useCallback(async (ruleSetId: string) => {
    await runMutation(() => loiRuleApi.deleteRuleSet(ruleSetId));
    setSelectedId(null);
  }, [runMutation]);

  const setDefaultRuleSet = useCallback(
    (ruleSetId: string) =>
      runMutation(async () => {
        const { data } = await loiRuleApi.setDefaultRuleSet(ruleSetId);
        return unwrap(data);
      }),
    [runMutation],
  );

  return {
    ruleSets,
    selected,
    selectRuleSet: setSelectedId,
    loading,
    error,
    busy,
    reload,
    createRuleSet,
    updateRuleSet,
    deleteRuleSet,
    setDefaultRuleSet,
  };
}
