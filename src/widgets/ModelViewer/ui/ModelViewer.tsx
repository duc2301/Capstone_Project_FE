import { t } from '@/shared/lib/i18n';
import { useApsViewer } from '../model/useApsViewer';

interface Props {
  urn: string;
  className?: string;
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

export function ModelViewer({ urn, className }: Props) {
  const { containerRef, status, error } = useApsViewer(urn);

  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#2b2b2b] ${className ?? ''}`}>
      <div ref={containerRef} className="absolute inset-0" />

      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#2b2b2b]">
          <Spinner />
          <p className="font-jakarta text-sm text-white/80">
            {t('viewer.status.loading')}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#2b2b2b] px-6 text-center">
          <p className="font-jakarta text-sm font-medium text-red-300">
            {error ?? t('viewer.error.load')}
          </p>
        </div>
      )}
    </div>
  );
}
