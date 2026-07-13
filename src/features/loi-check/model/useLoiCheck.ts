import { useCallback, useEffect, useState } from 'react';

import type { LoiCheckResult } from '@/entities/loi-check';
import { loiCheckApi, LoiCheckStatus } from '@/entities/loi-check';
import { t } from '@/shared/lib/i18n';

const POLL_INTERVAL_MS = 3000;

export function useLoiCheck(fileItemId: string | undefined) {
  const [result, setResult] = useState<LoiCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);

  const fetchOnce = useCallback(async (): Promise<LoiCheckResult | null> => {
    if (!fileItemId) return null;
    const { data } = await loiCheckApi.get(fileItemId);
    return data.isSuccess ? data.result ?? null : null;
  }, [fileItemId]);

  useEffect(() => {
    if (!fileItemId) return;

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetchOnce();
        if (!cancelled) setResult(r);
      } catch {
        if (!cancelled) setError(t('loi.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileItemId, fetchOnce]);

  const isRunning =
    result?.status === LoiCheckStatus.Pending || result?.status === LoiCheckStatus.Processing;

  useEffect(() => {
    if (!isRunning) return;

    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const r = await fetchOnce();
        if (!cancelled && r) setResult(r);
      } catch {
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isRunning, fetchOnce]);

  const recompute = useCallback(async () => {
    if (!fileItemId) return;
    setRecomputing(true);
    setError(null);
    try {
      const { data } = await loiCheckApi.recompute(fileItemId);
      if (data.isSuccess) setResult(data.result);
    } catch {
      setError(t('loi.error'));
    } finally {
      setRecomputing(false);
    }
  }, [fileItemId]);

  return { result, loading, error, recompute, recomputing };
}
