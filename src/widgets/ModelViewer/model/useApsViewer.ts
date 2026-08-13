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
  viewer: Autodesk.Viewing.GuiViewer3D | null;
}

interface ViewerSnapshot {
  key: string;
  status: ViewerStatus;
  error: string | null;
  viewer: Autodesk.Viewing.GuiViewer3D | null;
}

export function useApsViewer(urn: string): UseApsViewerReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Autodesk.Viewing.GuiViewer3D | null>(null);
  const [snapshot, setSnapshot] = useState<ViewerSnapshot | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!urn || !container) return;

    let cancelled = false;

    const fail = (message: string) => {
      if (cancelled) return;
      setSnapshot({ key: urn, status: 'error', error: message, viewer: null });
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

        Autodesk.Viewing.Document.load(
          `urn:${urn}`,
          (doc) => {
            if (cancelled) return;
            const defaultModel = doc.getRoot().getDefaultGeometry();
            viewer
              .loadDocumentNode(doc, defaultModel)
              .then(() => {
                if (!cancelled) {
                  setSnapshot({ key: urn, status: 'ready', error: null, viewer });
                }
              })
              .catch(() => fail(t('viewer.error.load')));
          },
          (code, message) => {
            console.error('[ApsViewer] Document.load failed', code, message);
            fail(t('viewer.error.load'));
          },
        );
      } catch {
        fail(t('viewer.error.init'));
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      setSnapshot(null);
      if (viewerRef.current) {
        viewerRef.current.finish();
        viewerRef.current = null;
      }
      window.Autodesk?.Viewing.shutdown();
    };
  }, [urn]);

  const current = snapshot?.key === urn ? snapshot : null;

  return {
    containerRef,
    status: current?.status ?? 'loading',
    error: current?.error ?? null,
    viewer: current?.viewer ?? null,
  };
}
