import { useCallback, useMemo, useState } from 'react';

import type {
  CreateLoiComponentPayload,
  LoiDiscipline,
  LoiRuleComponent,
  UpdateLoiComponentPayload,
} from '@/entities/loi-check';
import { loiRuleApi } from '@/entities/loi-check';
import { getApiErrorMessage } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

function unwrap<T>(payload: { isSuccess: boolean; message: string; result: T | null }): T {
  if (!payload.isSuccess || payload.result === null) throw new Error(payload.message);
  return payload.result;
}

const searchable = (component: LoiRuleComponent) =>
  `${component.code} ${component.name}`.toLowerCase();

export function useLoiComponents(projectId: string | null) {
  const [disciplineFilter, setDisciplineFilter] = useState<LoiDiscipline | null>(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: components, loading, error, reload } = useAsyncData<LoiRuleComponent[]>(
    projectId ?? 'none',
    async () => {
      if (!projectId) return [];
      const { data } = await loiRuleApi.getComponents(projectId);
      return unwrap(data);
    },
    {
      fallback: [],
      enabled: projectId !== null,
      toErrorMessage: (err) => getApiErrorMessage(err, t('loiRule.error.loadComponents')),
    },
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return components.filter((component) => {
      if (disciplineFilter !== null && component.discipline !== disciplineFilter) return false;
      if (query && !searchable(component).includes(query)) return false;
      return true;
    });
  }, [components, disciplineFilter, search]);

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

  const createComponent = useCallback(
    (payload: CreateLoiComponentPayload) =>
      runMutation(async () => {
        if (!projectId) throw new Error(t('loiRule.error.noRuleSet'));
        const { data } = await loiRuleApi.createComponent(projectId, payload);
        return unwrap(data);
      }),
    [projectId, runMutation],
  );

  const updateComponent = useCallback(
    (componentId: string, payload: UpdateLoiComponentPayload) =>
      runMutation(async () => {
        if (!projectId) throw new Error(t('loiRule.error.noRuleSet'));
        const { data } = await loiRuleApi.updateComponent(projectId, componentId, payload);
        return unwrap(data);
      }),
    [projectId, runMutation],
  );

  const deleteComponent = useCallback(
    (componentId: string) =>
      runMutation(() => {
        if (!projectId) throw new Error(t('loiRule.error.noRuleSet'));
        return loiRuleApi.deleteComponent(projectId, componentId);
      }),
    [projectId, runMutation],
  );

  return {
    components,
    visible,
    loading,
    error,
    busy,
    search,
    setSearch,
    disciplineFilter,
    setDisciplineFilter,
    reload,
    createComponent,
    updateComponent,
    deleteComponent,
  };
}
