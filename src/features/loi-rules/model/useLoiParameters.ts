import { useCallback, useState } from 'react';

import type {
  CreateLoiParameterPayload,
  LoiRuleParameter,
  UpdateLoiParameterPayload,
} from '@/entities/loi-check';
import { loiRuleApi } from '@/entities/loi-check';
import { getApiErrorMessage } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

function unwrap<T>(payload: { isSuccess: boolean; message: string; result: T | null }): T {
  if (!payload.isSuccess || payload.result === null) throw new Error(payload.message);
  return payload.result;
}

export function useLoiParameters(ruleSetId: string | null) {
  const [busy, setBusy] = useState(false);

  const { data: parameters, loading, error, reload } = useAsyncData<LoiRuleParameter[]>(
    ruleSetId ?? 'none',
    async () => {
      if (!ruleSetId) return [];
      const { data } = await loiRuleApi.getParameters(ruleSetId);
      return unwrap(data);
    },
    {
      fallback: [],
      enabled: ruleSetId !== null,
      toErrorMessage: (err) => getApiErrorMessage(err, t('loiRule.error.loadParameters')),
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

  const createParameter = useCallback(
    (payload: CreateLoiParameterPayload) =>
      runMutation(async () => {
        if (!ruleSetId) throw new Error(t('loiRule.error.noRuleSet'));
        const { data } = await loiRuleApi.createParameter(ruleSetId, payload);
        return unwrap(data);
      }),
    [ruleSetId, runMutation],
  );

  const updateParameter = useCallback(
    (parameterId: string, payload: UpdateLoiParameterPayload) =>
      runMutation(async () => {
        if (!ruleSetId) throw new Error(t('loiRule.error.noRuleSet'));
        const { data } = await loiRuleApi.updateParameter(ruleSetId, parameterId, payload);
        return unwrap(data);
      }),
    [ruleSetId, runMutation],
  );

  const deleteParameter = useCallback(
    (parameterId: string) =>
      runMutation(() => {
        if (!ruleSetId) throw new Error(t('loiRule.error.noRuleSet'));
        return loiRuleApi.deleteParameter(ruleSetId, parameterId);
      }),
    [ruleSetId, runMutation],
  );

  return { parameters, loading, error, busy, reload, createParameter, updateParameter, deleteParameter };
}
