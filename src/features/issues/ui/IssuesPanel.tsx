import { useState } from 'react';

import { t } from '@/shared/lib/i18n';

import { formatIssueDateTime, issuePriorityBadge, issueStatusBadge } from '../model/issueFormat';
import { useIssues } from '../model/useIssues';
import { CreateIssueModal } from './CreateIssueModal';
import { IssueDetailModal } from './IssueDetailModal';

interface IssuesPanelProps {
  projectId: string;
  fileItemId: string;
  onToast: (message: string, type?: 'success' | 'error') => void;
  onIssuesChanged?: () => void;
}

export function IssuesPanel({ projectId, fileItemId, onToast, onIssuesChanged }: IssuesPanelProps) {
  const { items, loading, error, refetch } = useIssues(fileItemId);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        {t('issues.panel.createButton')}
      </button>

      {loading ? (
        <p className="py-6 text-center text-sm text-text-muted">{t('common.loading')}</p>
      ) : error ? (
        <p className="py-6 text-center text-sm text-danger">{error}</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">{t('issues.panel.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((issue) => (
            <li key={issue.id}>
              <button
                type="button"
                onClick={() => setSelectedIssueId(issue.id)}
                className="w-full rounded-xl border border-card-border bg-card p-3 text-left transition-colors hover:bg-content-bg"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${issueStatusBadge(issue.status).className}`}>
                    {issueStatusBadge(issue.status).label}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${issuePriorityBadge(issue.priority).className}`}>
                    {issuePriorityBadge(issue.priority).label}
                  </span>
                </div>
                <p className="mt-1.5 truncate text-sm font-semibold text-text">{issue.title}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {issue.raisedByName ?? issue.raisedByAccountId} · {formatIssueDateTime(issue.createdAt)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showCreate && (
        <CreateIssueModal
          projectId={projectId}
          fileItemId={fileItemId}
          onClose={() => setShowCreate(false)}
          onToast={onToast}
          onCreated={() => {
            setShowCreate(false);
            void refetch();
            onIssuesChanged?.();
          }}
        />
      )}

      {selectedIssueId && (
        <IssueDetailModal
          issueId={selectedIssueId}
          onClose={() => setSelectedIssueId(null)}
          onToast={onToast}
          onChanged={() => {
            void refetch();
            onIssuesChanged?.();
          }}
        />
      )}
    </div>
  );
}
