import { useCallback, useState } from 'react';

import type { LoiMatrix, LoiMatrixRow } from '@/entities/loi-check';
import { loiRuleApi } from '@/entities/loi-check';
import { getApiErrorMessage } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

function unwrap<T>(payload: { isSuccess: boolean; message: string; result: T | null }): T {
  if (!payload.isSuccess || payload.result === null) throw new Error(payload.message);
  return payload.result;
}

export function useLoiMatrix(ruleSetId: string | null, componentId: string | null) {
  const [saving, setSaving] = useState(false);

  const { data: matrix, loading, error, setData, reload } = useAsyncData<LoiMatrix | null>(
    `${ruleSetId ?? 'none'}|${componentId ?? 'none'}`,
    async () => {
      if (!ruleSetId || !componentId) return null;
      const { data } = await loiRuleApi.getMatrix(ruleSetId, componentId);
      return unwrap(data);
    },
    {
      fallback: null,
      enabled: ruleSetId !== null && componentId !== null,
      toErrorMessage: (err) => getApiErrorMessage(err, t('loiRule.error.loadMatrix')),
    },
  );

  const runMutation = useCallback(async (action: () => Promise<LoiMatrix>) => {
    if (!ruleSetId || !componentId) throw new Error(t('loiRule.error.noComponent'));
    setSaving(true);
    try {
      const next = await action();
      setData(next);
      return next;
    } finally {
      setSaving(false);
    }
  }, [ruleSetId, componentId, setData]);

  const saveVariant = useCallback(
    (variant: string | null, rows: LoiMatrixRow[]) =>
      runMutation(async () => {
        const { data } = await loiRuleApi.saveMatrix(ruleSetId!, componentId!, { variant, rows });
        return unwrap(data);
      }),
    [ruleSetId, componentId, runMutation],
  );

  const renameVariant = useCallback(
    (currentVariant: string | null, newVariant: string | null) =>
      runMutation(async () => {
        const { data } = await loiRuleApi.renameVariant(ruleSetId!, componentId!, {
          currentVariant,
          newVariant,
        });
        return unwrap(data);
      }),
    [ruleSetId, componentId, runMutation],
  );

  const deleteVariant = useCallback(
    (variant: string | null) =>
      runMutation(async () => {
        const { data } = await loiRuleApi.deleteVariant(ruleSetId!, componentId!, variant);
        return unwrap(data);
      }),
    [ruleSetId, componentId, runMutation],
  );

  return { matrix, loading, error, saving, reload, saveVariant, renameVariant, deleteVariant };
}
