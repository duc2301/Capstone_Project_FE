import { useCallback, useEffect, useRef, useState } from 'react';

import { viewerApi } from '@/entities/viewer';
import { t } from '@/shared/lib/i18n';
import { isSupportedFile } from './supportedFormats';

export type UploadPhase =
  | 'idle'
  | 'uploading'
  | 'translating'
  | 'success'
  | 'error';

interface UseModelUploadReturn {
  phase: UploadPhase;
  uploadProgress: number;
  translateProgress: string;
  urn: string | null;
  fileName: string | null;
  error: string | null;
  upload: (file: File) => Promise<void>;
  reset: () => void;
}

const POLL_INTERVAL_MS = 3000;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function useModelUpload(): UseModelUploadReturn {
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [translateProgress, setTranslateProgress] = useState('');
  const [urn, setUrn] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setUploadProgress(0);
    setTranslateProgress('');
    setUrn(null);
    setFileName(null);
    setError(null);
  }, []);

  const upload = useCallback(async (file: File) => {
    if (!isSupportedFile(file.name)) {
      setPhase('error');
      setError(t('viewer.error.unsupported'));
      return;
    }

    setPhase('uploading');
    setError(null);
    setUploadProgress(0);
    setTranslateProgress('');
    setUrn(null);
    setFileName(file.name);

    try {
      const { data } = await viewerApi.uploadModel(file, setUploadProgress);
      if (cancelledRef.current) return;

      if (!data.isSuccess || !data.result) {
        setPhase('error');
        setError(data.message || t('viewer.error.upload'));
        return;
      }

      const uploadedUrn = data.result.urn;
      setPhase('translating');

      while (!cancelledRef.current) {
        const { data: statusData } = await viewerApi.getStatus(uploadedUrn);
        if (cancelledRef.current) return;

        if (!statusData.isSuccess || !statusData.result) {
          setPhase('error');
          setError(statusData.message || t('viewer.error.status'));
          return;
        }

        const { status, progress } = statusData.result;
        setTranslateProgress(progress);

        if (status === 'success') {
          setUrn(uploadedUrn);
          setPhase('success');
          return;
        }

        if (status === 'failed' || status === 'timeout') {
          setPhase('error');
          setError(t('viewer.error.translateFailed'));
          return;
        }

        await delay(POLL_INTERVAL_MS);
      }
    } catch {
      if (!cancelledRef.current) {
        setPhase('error');
        setError(t('viewer.error.upload'));
      }
    }
  }, []);

  return {
    phase,
    uploadProgress,
    translateProgress,
    urn,
    fileName,
    error,
    upload,
    reset,
  };
}
