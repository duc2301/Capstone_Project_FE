import { useEffect } from 'react';

import { t } from '@/shared/lib/i18n';
import { useApsViewer } from '../model/useApsViewer';

interface Props {
  urn: string;
  className?: string;
  onViewerReady?: (viewer: Autodesk.Viewing.GuiViewer3D | null) => void;
}

function Spinner() {
  return (
    <svg className="h-8 w-8 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z"
      />
    </svg>
  );
}

export function ModelViewer({ urn, className, onViewerReady }: Props) {
  const { containerRef, status, error, viewer } = useApsViewer(urn);

  useEffect(() => {
    onViewerReady?.(viewer);
  }, [viewer, onViewerReady]);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-viewer-shell ${className ?? ''}`}>
      <div ref={containerRef} className="absolute inset-0" />

      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-viewer-shell">
          <Spinner />
          <p className="text-sm text-white/80">
            {t('viewer.status.loading')}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-viewer-shell px-6 text-center">
          <p className="text-sm font-medium text-danger-light">
            {error ?? t('viewer.error.load')}
          </p>
        </div>
      )}
    </div>
  );
}
