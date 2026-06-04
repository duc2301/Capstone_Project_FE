import { useSearchParams } from 'react-router-dom';

import { ModelDropzone, TranslationProgress, useModelUpload } from '@/features/model-upload';
import { t } from '@/shared/lib/i18n';
import { Header } from '@/widgets/Header';
import { ModelViewer } from '@/widgets/ModelViewer';

const HEADER_OFFSET = 'h-[92px] shrink-0';

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border border-[#FFDAD6] bg-white px-8 py-12 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFDAD6]">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#BA1A1A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </span>
      <p className="font-jakarta text-sm text-[#43493C]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl bg-[#406623] px-8 py-3 font-jakarta text-sm font-semibold tracking-[0.14px] text-white transition-colors hover:bg-[#34521c]"
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
      <div className="flex h-screen flex-col bg-[#2b2b2b]">
        <Header />
        <div className={HEADER_OFFSET} />
        <div className="relative flex flex-1 flex-col">
          {!urnFromQuery && (
            <div className="flex items-center justify-between gap-4 bg-[#1f1f1f] px-6 py-3">
              <p className="truncate font-jakarta text-sm text-white/80">{fileName}</p>
              <button
                type="button"
                onClick={reset}
                className="shrink-0 rounded-lg border border-white/30 px-4 py-1.5 font-jakarta text-xs font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t('viewer.back')}
              </button>
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
    <div className="flex min-h-screen flex-col bg-[#FBF9F1]">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-16 pt-[120px]">
        <div className="mb-2 max-w-2xl text-center">
          <h1 className="font-display text-3xl font-bold text-[#1B1C17]">
            {t('viewer.title')}
          </h1>
          <p className="mt-2 font-jakarta text-sm text-[#43493C]">
            {t('viewer.subtitle')}
          </p>
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
