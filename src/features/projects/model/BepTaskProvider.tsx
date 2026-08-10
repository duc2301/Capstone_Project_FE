import type { ReactNode } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import type { BepParseResult } from '@/entities/project';
import { projectApi } from '@/entities/project';
import { getApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

import type { BepTaskContextValue, BepTaskStatus } from './bepTaskContext';
import { BepTaskContext } from './bepTaskContext';

interface BepTaskState {
  status: BepTaskStatus;
  fileName: string | null;
  result: BepParseResult | null;
  error: string | null;
}

const IDLE_STATE: BepTaskState = {
  status: 'idle',
  fileName: null,
  result: null,
  error: null,
};

export function BepTaskProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BepTaskState>(IDLE_STATE);
  const runIdRef = useRef(0);

  const start = useCallback((file: File) => {
    runIdRef.current += 1;
    const runId = runIdRef.current;
    setState({ status: 'running', fileName: file.name, result: null, error: null });

    const formData = new FormData();
    formData.append('file', file);

    projectApi
      .parseBep(formData)
      .then(({ data }) => {
        if (runIdRef.current !== runId) return;
        if (!data.isSuccess || !data.result) {
          setState({
            status: 'error',
            fileName: file.name,
            result: null,
            error: data.message || t('projects.bep.failed'),
          });
          return;
        }
        setState({ status: 'done', fileName: file.name, result: data.result, error: null });
      })
      .catch((err: unknown) => {
        if (runIdRef.current !== runId) return;
        setState({
          status: 'error',
          fileName: file.name,
          result: null,
          error: getApiErrorMessage(err, t('projects.bep.failed')),
        });
      });
  }, []);

  const open = useCallback(() => {
    setState((prev) => (prev.status === 'done' ? { ...prev, status: 'opened' } : prev));
  }, []);

  const dismiss = useCallback(() => {
    runIdRef.current += 1;
    setState(IDLE_STATE);
  }, []);

  const value = useMemo<BepTaskContextValue>(
    () => ({ ...state, start, open, dismiss }),
    [state, start, open, dismiss],
  );

  return <BepTaskContext.Provider value={value}>{children}</BepTaskContext.Provider>;
}
