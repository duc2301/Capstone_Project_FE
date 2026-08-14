import { t } from '@/shared/lib/i18n';
import { FileTypeIcon } from '../file-icon';

export interface EmptyViewerStateProps {
  title: string;
  desc: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  danger?: boolean;
  disabled?: boolean;
  fileName: string;
  format?: string | null;
  detail?: string | null;
}

export function EmptyViewerState({
  title,
  desc,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  danger = false,
  disabled = false,
  fileName,
  format,
  detail,
}: EmptyViewerStateProps) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-[var(--radius-card)] bg-card/90 p-8 text-center shadow-card">
      {danger ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-card)] bg-danger-light text-danger">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
      ) : (
        <FileTypeIcon fileName={fileName} format={format} size="lg" />
      )}
      <h3 className="heading-card text-text">{title}</h3>
      <p className="text-sm text-text-muted">{desc}</p>
      {detail && (
        <details className="w-full text-left">
          <summary className="cursor-pointer text-xs font-medium text-text-muted">
            {t('viewer.error.detail')}
          </summary>
          <p className="mt-2 max-h-32 overflow-auto rounded-[var(--radius-input)] bg-content-bg p-3 text-2xs leading-5 break-words text-text-secondary">
            {detail}
          </p>
        </details>
      )}
      {(primaryLabel && onPrimary) || (secondaryLabel && onSecondary) ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          {primaryLabel && onPrimary && (
            <button
              type="button"
              onClick={onPrimary}
              disabled={disabled}
              className="rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {primaryLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="rounded-[var(--radius-button)] border border-primary px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
