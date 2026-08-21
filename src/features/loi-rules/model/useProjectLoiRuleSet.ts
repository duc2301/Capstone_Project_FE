import { useCallback, useState } from 'react';

import type { LoiRuleSet, UpdateLoiRuleSetPayload } from '@/entities/loi-check';
import { loiRuleApi } from '@/entities/loi-check';
import { getApiErrorMessage } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

export function useProjectLoiRuleSet(projectId: string | undefined, manageable = true) {
  const [busy, setBusy] = useState(false);

  const { data: ruleSet, loading, error, reload } = useAsyncData<LoiRuleSet | null>(
    `project-loi-rule-set:${projectId ?? ''}:${manageable}`,
    async () => {
      if (!projectId) return null;
      const { data } = manageable
        ? await loiRuleApi.getRuleSet(projectId)
        : await loiRuleApi.getRuleSetSummary(projectId);
      if (!data.isSuccess) throw new Error(data.message);
      return data.result ?? null;
    },
    {
      fallback: null,
      enabled: Boolean(projectId),
      toErrorMessage: (err) => getApiErrorMessage(err, t('loiRule.error.loadRuleSets')),
    },
  );

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

  const renameRuleSet = useCallback(
    (payload: UpdateLoiRuleSetPayload) =>
      runMutation(async () => {
        if (!projectId) throw new Error(t('loiRule.error.noRuleSet'));
        const { data } = await loiRuleApi.updateRuleSet(projectId, payload);
        if (!data.isSuccess || !data.result) throw new Error(data.message);
        return data.result;
      }),
    [projectId, runMutation],
  );

  const deleteRuleSet = useCallback(
    () =>
      runMutation(() => {
        if (!projectId) throw new Error(t('loiRule.error.noRuleSet'));
        return loiRuleApi.deleteRuleSet(projectId);
      }),
    [projectId, runMutation],
  );

  return { ruleSet, loading, error, busy, reload, renameRuleSet, deleteRuleSet };
}
