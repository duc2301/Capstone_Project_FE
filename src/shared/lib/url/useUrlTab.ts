import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlTab<T extends string>(
  tabs: readonly T[],
  fallback: T,
  paramKey = 'tab',
): [T, (next: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const fromUrl = searchParams.get(paramKey) as T | null;
  const [tab, setTab] = useState<T>(fromUrl && tabs.includes(fromUrl) ? fromUrl : fallback);

  const selectTab = useCallback(
    (next: T) => {
      setTab(next);
      setSearchParams(
        (params) => {
          const updated = new URLSearchParams(params);
          updated.set(paramKey, next);
          return updated;
        },
        { replace: true },
      );
    },
    [paramKey, setSearchParams],
  );

  return [tab, selectTab];
}
