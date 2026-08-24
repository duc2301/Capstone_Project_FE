import { useCallback, useEffect, useRef, useState } from 'react';

interface Snapshot<T> {
  key: string;
  scope: string | null;
  data: T;
  error: string | null;
}

interface UseAsyncDataOptions<T> {
  fallback: T;
  enabled?: boolean;
  toErrorMessage?: (error: unknown) => string;
  keepPreviousDataWithin?: string;
}

export interface AsyncDataResult<T> {
  data: T;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  setData: (updater: T | ((current: T) => T)) => void;
  setError: (message: string | null) => void;
  reload: () => Promise<void>;
}

export function useAsyncData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions<T>,
): AsyncDataResult<T> {
  const { fallback, enabled = true, toErrorMessage, keepPreviousDataWithin } = options;

  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const fetcherRef = useRef(fetcher);
  const fallbackRef = useRef(fallback);
  const toErrorMessageRef = useRef(toErrorMessage);
  const scopeRef = useRef(keepPreviousDataWithin);
  const waitersRef = useRef<(() => void)[]>([]);

  const flushWaiters = useCallback(() => {
    const waiters = waitersRef.current;
    waitersRef.current = [];
    waiters.forEach((resolve) => resolve());
  }, []);

  useEffect(() => {
    fetcherRef.current = fetcher;
    fallbackRef.current = fallback;
    toErrorMessageRef.current = toErrorMessage;
    scopeRef.current = keepPreviousDataWithin;
  });

  useEffect(() => {
    if (!enabled) {
      flushWaiters();
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const data = await fetcherRef.current();
        if (!cancelled) setSnapshot({ key, scope: scopeRef.current ?? null, data, error: null });
      } catch (err) {
        if (!cancelled) {
          const message = toErrorMessageRef.current?.(err) ?? null;
          setSnapshot({
            key,
            scope: scopeRef.current ?? null,
            data: fallbackRef.current,
            error: message,
          });
        }
      } finally {
        if (!cancelled) flushWaiters();
      }
    })();

    return () => {
      cancelled = true;
      flushWaiters();
    };
  }, [key, enabled, reloadToken, flushWaiters]);

  const isFresh = snapshot !== null && snapshot.key === key;
  const canKeepPrevious =
    !isFresh
    && enabled
    && snapshot !== null
    && keepPreviousDataWithin !== undefined
    && snapshot.scope === keepPreviousDataWithin;

  const setData = useCallback((updater: T | ((current: T) => T)) => {
    setSnapshot((current) => {
      if (!current) return current;
      const next = typeof updater === 'function'
        ? (updater as (value: T) => T)(current.data)
        : updater;
      return { ...current, data: next };
    });
  }, []);

  const setError = useCallback((message: string | null) => {
    setSnapshot((current) => (current ? { ...current, error: message } : current));
  }, []);

  const reload = useCallback(
    () =>
      new Promise<void>((resolve) => {
        waitersRef.current.push(resolve);
        setReloadToken((token) => token + 1);
      }),
    [],
  );

  return {
    data: isFresh || canKeepPrevious ? snapshot.data : fallback,
    loading: enabled && !isFresh && !canKeepPrevious,
    refreshing: canKeepPrevious,
    error: isFresh ? snapshot.error : null,
    setData,
    setError,
    reload,
  };
}
