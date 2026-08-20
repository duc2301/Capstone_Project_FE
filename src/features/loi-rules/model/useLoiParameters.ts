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

export function useLoiParameters(projectId: string | null) {
  const [busy, setBusy] = useState(false);

  const { data: parameters, loading, error, reload } = useAsyncData<LoiRuleParameter[]>(
    projectId ?? 'none',
    async () => {
      if (!projectId) return [];
      const { data } = await loiRuleApi.getParameters(projectId);
      return unwrap(data);
    },
    {
      fallback: [],
      enabled: projectId !== null,
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
        if (!projectId) throw new Error(t('loiRule.error.noRuleSet'));
        const { data } = await loiRuleApi.createParameter(projectId, payload);
        return unwrap(data);
      }),
    [projectId, runMutation],
  );

  const updateParameter = useCallback(
    (parameterId: string, payload: UpdateLoiParameterPayload) =>
      runMutation(async () => {
        if (!projectId) throw new Error(t('loiRule.error.noRuleSet'));
        const { data } = await loiRuleApi.updateParameter(projectId, parameterId, payload);
        return unwrap(data);
      }),
    [projectId, runMutation],
  );

  const deleteParameter = useCallback(
    (parameterId: string) =>
      runMutation(() => {
        if (!projectId) throw new Error(t('loiRule.error.noRuleSet'));
        return loiRuleApi.deleteParameter(projectId, parameterId);
      }),
    [projectId, runMutation],
  );

  return { parameters, loading, error, busy, reload, createParameter, updateParameter, deleteParameter };
}
