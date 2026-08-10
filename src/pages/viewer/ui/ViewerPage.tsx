import { useSearchParams } from 'react-router-dom';

import { ModelDropzone, TranslationProgress, useModelUpload } from '@/features/model-upload';
import { ToolbarIconButton } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import { Header } from '@/widgets/Header';
import { ModelViewer } from '@/widgets/ModelViewer';

const HEADER_OFFSET = 'h-[92px] shrink-0';

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border border-danger-container bg-white px-8 py-12 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <span className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-card)] bg-danger-container">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-danger-strong)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </span>
      <p className="text-sm text-text-secondary">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-[var(--radius-button)] bg-primary px-8 py-3 text-sm font-semibold tracking-[0.14px] text-white transition-colors hover:bg-primary-hover"
      >
        {t('viewer.error.retry')}
      </button>
    </div>
  );
}

export function ViewerPage() {
  const [searchParams] = useSearchParams();
  const urnFromQuery = searchParams.get('urn');

  const { phase, uploadProgress, translateProgress, urn, fileName, error, upload, reset } =
    useModelUpload();

  const activeUrn = urnFromQuery ?? (phase === 'success' ? urn : null);

  if (activeUrn) {
    return (
      <div className="flex h-screen flex-col bg-viewer-shell">
        <Header />
        <div className={HEADER_OFFSET} />
        <div className="relative flex flex-1 flex-col">
          {!urnFromQuery && (
            <div className="flex items-center justify-between gap-4 bg-viewer-shell-dark px-6 py-3">
              <p className="truncate text-sm text-white/80">{fileName}</p>
              <ToolbarIconButton
                size="sm"
                variant="ghost"
                label={t('viewer.back')}
                onClick={reset}
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                }
              />
            </div>
          )}
          <div className="relative flex-1">
            <ModelViewer urn={activeUrn} className="absolute inset-0" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-page-cream">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-16 pt-[120px]">
        <div className="mb-2 max-w-2xl text-center">
          <h1 className="heading-page">
            {t('viewer.title')}
          </h1>
        </div>

        {phase === 'idle' && <ModelDropzone onFile={upload} />}

        {(phase === 'uploading' || phase === 'translating') && (
          <TranslationProgress
            phase={phase}
            uploadProgress={uploadProgress}
            translateProgress={translateProgress}
            fileName={fileName}
          />
        )}

        {phase === 'error' && (
          <ErrorCard message={error ?? t('viewer.error.upload')} onRetry={reset} />
        )}
      </main>
    </div>
  );
}
