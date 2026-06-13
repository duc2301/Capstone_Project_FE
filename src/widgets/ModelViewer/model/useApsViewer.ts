import { useEffect, useRef, useState } from 'react';

import { viewerApi } from '@/entities/viewer';
import { apsConfig } from '@/shared/config';
import { loadViewerSdk } from '@/shared/lib/aps';
import { t } from '@/shared/lib/i18n';
import { VIEWER_EXTENSIONS } from './viewerExtensions';

export type ViewerStatus = 'loading' | 'ready' | 'error';

interface UseApsViewerReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  status: ViewerStatus;
  error: string | null;
}

const POLL_INTERVAL_MS = 3000;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
export function useApsViewer(urn: string): UseApsViewerReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Autodesk.Viewing.GuiViewer3D | null>(null);
  const [status, setStatus] = useState<ViewerStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!urn || !container) return;

    let cancelled = false;
    setStatus('loading');
    setError(null);

    const fail = (message: string) => {
      if (cancelled) return;
      setStatus('error');
      setError(message);
    };

    const waitForTranslation = async (): Promise<boolean> => {
      while (!cancelled) {
        const { data } = await viewerApi.getStatus(urn);
        if (cancelled) return false;

        if (!data.isSuccess || !data.result) {
          fail(data.message || t('viewer.error.status'));
          return false;
        }

        const { status: translationStatus } = data.result;
        if (translationStatus === 'success') return true;
        if (translationStatus === 'failed' || translationStatus === 'timeout') {
          fail(t('viewer.error.translateFailed'));
          return false;
        }

        await delay(POLL_INTERVAL_MS);
      }
      return false;
    };

    const getAccessToken = (onTokenReady: Autodesk.Viewing.TokenCallback) => {
      viewerApi
        .getToken()
        .then(({ data }) => {
          if (data.isSuccess && data.result) {
            onTokenReady(data.result.accessToken, data.result.expiresIn);
          } else {
            fail(data.message || t('viewer.error.token'));
          }
        })
        .catch(() => fail(t('viewer.error.token')));
    };

    const initialize = async () => {
      try {
        await loadViewerSdk();
        if (cancelled) return;

        await new Promise<void>((resolve) => {
          window.Autodesk!.Viewing.Initializer(
            { env: apsConfig.env, api: apsConfig.api, getAccessToken },
            resolve,
          );
        });
        if (cancelled) return;

        const viewer = new Autodesk.Viewing.GuiViewer3D(container, {
          extensions: VIEWER_EXTENSIONS,
        });
        const startCode = viewer.start();
        if (startCode !== 0) {
          viewer.finish();
          fail(t('viewer.error.init'));
          return;
        }
        viewerRef.current = viewer;

        const translated = await waitForTranslation();
        if (cancelled || !translated) return;

        Autodesk.Viewing.Document.load(
          `urn:${urn}`,
          (doc) => {
            if (cancelled) return;
            const defaultModel = doc.getRoot().getDefaultGeometry();
            viewer
              .loadDocumentNode(doc, defaultModel)
              .then(() => {
                if (!cancelled) setStatus('ready');
              })
              .catch(() => fail(t('viewer.error.load')));
          },
          (_code, message) => fail(message || t('viewer.error.load')),
        );
      } catch {
        fail(t('viewer.error.init'));
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      if (viewerRef.current) {
        viewerRef.current.finish();
        viewerRef.current = null;
      }
      window.Autodesk?.Viewing.shutdown();
    };
  }, [urn]);

  return { containerRef, status, error };
}
