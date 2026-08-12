import { useCallback, useState } from 'react';

import type { LoiRuleSet } from '@/entities/loi-check';
import { loiRuleApi } from '@/entities/loi-check';
import { getApiErrorMessage } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

interface ProjectLoiRuleSetState {
  ruleSets: LoiRuleSet[];
  current: LoiRuleSet | null;
}

export function useProjectLoiRuleSet(projectId: string) {
  const [saving, setSaving] = useState(false);

  const { data, loading, error, setData, reload } = useAsyncData<ProjectLoiRuleSetState>(
    projectId,
    async () => {
      const [listResponse, currentResponse] = await Promise.all([
        loiRuleApi.getSelectableRuleSets(projectId),
        loiRuleApi.getProjectRuleSet(projectId),
      ]);
      if (!listResponse.data.isSuccess || !listResponse.data.result)
        throw new Error(listResponse.data.message);
      return {
        ruleSets: listResponse.data.result,
        current: currentResponse.data.result ?? null,
      };
    },
    {
      fallback: { ruleSets: [], current: null },
      toErrorMessage: (err) => getApiErrorMessage(err, t('loiRule.error.loadRuleSets')),
    },
  );

  const setRuleSet = useCallback(
    async (ruleSetId: string | null) => {
      setSaving(true);
      try {
        const { data: response } = await loiRuleApi.setProjectRuleSet(projectId, ruleSetId);
        if (!response.isSuccess) throw new Error(response.message);
        setData((current) => ({ ...current, current: response.result ?? null }));
      } finally {
        setSaving(false);
      }
    },
    [projectId, setData],
  );

  const effective = data.current ?? data.ruleSets.find((item) => item.isDefault) ?? null;

  return { ruleSets: data.ruleSets, current: data.current, effective, loading, error, saving, reload, setRuleSet };
}
