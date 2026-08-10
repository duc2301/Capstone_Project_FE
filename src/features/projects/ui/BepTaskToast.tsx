import { useNavigate } from 'react-router-dom';

import { t } from '@/shared/lib/i18n';

import { useBepTask } from '../model/useBepTask';

const PROJECTS_PATH = '/projects';

export function BepTaskToast() {
  const navigate = useNavigate();
  const { status, fileName, result, error, open, dismiss } = useBepTask();

  if (status !== 'running' && status !== 'done' && status !== 'error') return null;

  const isRunning = status === 'running';
  const isDone = status === 'done';

  const title = isRunning
    ? t('projects.bep.task.running')
    : isDone
      ? t('projects.bep.task.done')
      : t('projects.bep.task.failed');

  const hint = isRunning
    ? t('projects.bep.task.runningHint')
    : isDone
      ? result?.extractionEmpty
        ? t('projects.bep.empty')
        : t('projects.bep.task.doneHint')
      : error ?? t('projects.bep.failed');

  const toneClass = isRunning
    ? 'border-primary/30'
    : isDone
      ? 'border-success/40'
      : 'border-danger/40';

  const handleOpen = () => {
    open();
    navigate(PROJECTS_PATH);
  };

  const body = (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <span className="mt-0.5 shrink-0">
        {isRunning ? (
          <svg className="h-5 w-5 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
        ) : isDone ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
            <circle cx="12" cy="12" r="10" />
            <polyline points="8 12 11 15 16 9" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-danger">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="13" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </span>

      <div className="min-w-0 flex-1 text-left">
        <p className="heading-label truncate">{title}</p>
        {fileName && <p className="field-hint truncate">{fileName}</p>}
        <p className="modal-text mt-1">{hint}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed right-6 top-16 z-[70] w-[320px] max-w-[calc(100vw-3rem)] animate-slide-up">
      <div className={`relative overflow-hidden rounded-[var(--radius-card)] border bg-card shadow-modal ${toneClass}`}>
        {!isRunning && (
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('projects.bep.task.dismiss')}
            title={t('projects.bep.task.dismiss')}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {isDone ? (
          <button type="button" onClick={handleOpen} className="block w-full transition-colors hover:bg-content-bg">
            {body}
          </button>
        ) : (
          body
        )}
      </div>
    </div>
  );
}
