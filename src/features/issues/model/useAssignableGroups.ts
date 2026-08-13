import type { AssignableGroup } from '@/entities/issue';
import { issueApi } from '@/entities/issue';
import { useAsyncData } from '@/shared/lib/async';

export function useAssignableGroups(fileItemId: string | null | undefined) {
  const { data: groups } = useAsyncData<AssignableGroup[]>(
    `assignable-groups:${fileItemId ?? ''}`,
    () => issueApi.getAssignableGroups(fileItemId!),
    { fallback: [], enabled: Boolean(fileItemId) },
  );

  return { groups };
}
