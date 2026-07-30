import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

import type { LoiCheckResult, LoiStage, LoiUnmappedParam } from '@/entities/loi-check';
import { DEFAULT_LOI_STAGE, loiAliasApi, loiCheckApi, LoiCheckStatus } from '@/entities/loi-check';
import { t } from '@/shared/lib/i18n';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_FAILURES = 3;

function errorMessage(e: unknown, fallbackKey: 'loi.error' | 'loi.mapping.error'): string {
  // BE trả lý do nghiệp vụ trong message (không phải .ifc, không đủ quyền...) -> ưu tiên hiện lý do đó.
  const message = axios.isAxiosError(e) ? e.response?.data?.message : null;
  return typeof message === 'string' && message ? message : t(fallbackKey);
}

export function useLoiCheck(fileItemId: string | undefined, projectId: string | undefined) {
  const [result, setResult] = useState<LoiCheckResult | null>(null);
  const [stage, setStage] = useState<LoiStage>(DEFAULT_LOI_STAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recomputing, setRecomputing] = useState(false);
  // Tên tham số đang ánh xạ, dùng để khoá đúng một dòng đang xử lý.
  const [mappingParam, setMappingParam] = useState<string | null>(null);
  const [mappingError, setMappingError] = useState<string | null>(null);

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
        if (cancelled) return;
        setResult(r);
        if (r) setStage(r.targetStage as LoiStage);
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
    // Lỗi lẻ thường là mạng chập chờn -> thử lại; hỏng liên tiếp thì dừng và báo.
    let consecutiveFailures = 0;

    const timer = setInterval(() => {
      void (async () => {
        try {
          const r = await fetchOnce();
          if (cancelled) return;
          consecutiveFailures = 0;
          if (r) setResult(r);
        } catch (e) {
          if (cancelled) return;
          consecutiveFailures += 1;
          if (consecutiveFailures >= MAX_POLL_FAILURES) {
            clearInterval(timer);
            setError(errorMessage(e, 'loi.error'));
          }
        }
      })();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isRunning, fetchOnce]);

  const recompute = useCallback(async () => {
    if (!fileItemId || recomputing || isRunning) return;
    setRecomputing(true);
    setError(null);
    try {
      const { data } = await loiCheckApi.recompute(fileItemId, stage);
      if (data.isSuccess) setResult(data.result);
    } catch (e) {
      setError(errorMessage(e, 'loi.error'));
    } finally {
      setRecomputing(false);
    }
  }, [fileItemId, recomputing, isRunning, stage]);

  // Xác nhận gợi ý ánh xạ: lưu vào từ điển dự án rồi kiểm lại ngay.
  const confirmMapping = useCallback(
    async (param: LoiUnmappedParam) => {
      if (!projectId || !fileItemId || mappingParam) return;
      setMappingParam(param.paramNameInModel);
      setMappingError(null);
      try {
        await loiAliasApi.create(projectId, {
          paramNameInModel: param.paramNameInModel,
          standardParamName: param.suggestedParamNameNormalized,
        });
        const { data } = await loiCheckApi.recompute(fileItemId, stage);
        if (data.isSuccess) setResult(data.result);
      } catch (e) {
        setMappingError(errorMessage(e, 'loi.mapping.error'));
      } finally {
        setMappingParam(null);
      }
    },
    [projectId, fileItemId, mappingParam, stage],
  );

  return {
    result,
    stage,
    setStage,
    loading,
    error,
    recompute,
    recomputing,
    isRunning,
    canMap: Boolean(projectId),
    confirmMapping,
    mappingParam,
    mappingError,
  };
}
