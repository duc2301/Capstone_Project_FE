import { t } from '@/shared/lib/i18n';

interface Props {
  phase: 'uploading' | 'translating';
  uploadProgress: number;
  translateProgress: string;
  fileName: string | null;
}

function Spinner() {
  return (
    <svg
      className="h-6 w-6 animate-spin text-primary"
      viewBox="0 0 24 24"
      fill="none"
    >
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

export function TranslationProgress({
  phase,
  uploadProgress,
  translateProgress,
  fileName,
}: Props) {
  const isUploading = phase === 'uploading';
  const percent = isUploading ? uploadProgress : null;

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border border-card-border bg-white px-8 py-12 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <Spinner />

      <div className="flex flex-col gap-1">
        <h2 className="heading-tab">
          {isUploading
            ? t('viewer.upload.uploading')
            : t('viewer.upload.translating')}
        </h2>
        {fileName && (
          <p className="max-w-md truncate text-sm text-text-secondary">
            {fileName}
          </p>
        )}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-card-border">
        <div
          className={`h-full rounded-full bg-primary transition-all duration-300 ${
            percent === null ? 'w-1/3 animate-pulse' : ''
          }`}
          style={percent === null ? undefined : { width: `${percent}%` }}
        />
      </div>

      <p className="text-xs text-text-secondary/70">
        {isUploading
          ? `${uploadProgress}%`
          : translateProgress || t('viewer.upload.translatingHint')}
      </p>
    </div>
  );
}
