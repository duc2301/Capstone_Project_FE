import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { IssuePriority, IssueStatus } from '@/entities/issue';
import { t } from '@/shared/lib/i18n';

import { formatIssueDateTime, issuePriorityBadge, issueStatusBadge } from '../model/issueFormat';
import { useProjectIssues } from '../model/useProjectIssues';

const STATUS_FILTERS: (IssueStatus | 'all')[] = ['all', 'Open', 'InProgress', 'Answered', 'Closed'];
const PRIORITY_FILTERS: (IssuePriority | 'all')[] = ['all', 'Low', 'Medium', 'High', 'Critical'];

const selectCls =
  'rounded-(--radius-input) border border-input-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-primary';

interface Props {
  projectId: string;
}

/** Tab "Vấn đề" của dự án: tổng hợp issue từ mọi tài liệu người dùng được phép xem. */
export function ProjectIssuesTab({ projectId }: Props) {
  const navigate = useNavigate();
  const { issues, loading, error } = useProjectIssues(projectId);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<IssueStatus | 'all'>('all');
  const [priority, setPriority] = useState<IssuePriority | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return issues.filter((i) => {
      if (status !== 'all' && i.status !== status) return false;
      if (priority !== 'all' && i.priority !== priority) return false;
      if (!q) return true;
      return (
        i.title.toLowerCase().includes(q)
        || (i.linkedFileName?.toLowerCase().includes(q) ?? false)
        || (i.assignedToName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [issues, query, status, priority]);

  const openIssue = (fileItemId: string | null, issueId: string) => {
    if (!fileItemId) return;
    navigate(`/projects/${projectId}/files/${fileItemId}/issues/${issueId}`);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="heading-tab">
          {t('projectDetail.tab.issues')}
        </h2>
        <p className="text-sm text-text-muted">
          {t('projectIssues.count')}: <span className="font-semibold text-text">{filtered.length}</span>
        </p>
      </div>

      {/* Bộ lọc */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('projectIssues.searchPlaceholder')}
          className={`${selectCls} flex-1`}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value as IssueStatus | 'all')} className={selectCls}>
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? t('projectIssues.filter.allStatus') : issueStatusBadge(s).label}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as IssuePriority | 'all')} className={selectCls}>
          {PRIORITY_FILTERS.map((p) => (
            <option key={p} value={p}>
              {p === 'all' ? t('projectIssues.filter.allPriority') : issuePriorityBadge(p).label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-(--radius-card) border border-card-border bg-card py-20 shadow-card">
          <p className="text-sm text-text-muted">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="rounded-(--radius-card) border border-danger/20 bg-danger-light p-6 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      ) : (
        <div className="admin-scrollbar min-h-0 flex-1 overflow-auto rounded-(--radius-card) border border-card-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-input-bg">
              <tr className="border-b border-card-border text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3">{t('projectIssues.col.title')}</th>
                <th className="px-5 py-3">{t('projectIssues.col.priority')}</th>
                <th className="px-5 py-3">{t('projectIssues.col.status')}</th>
                <th className="px-5 py-3">{t('projectIssues.col.assignee')}</th>
                <th className="px-5 py-3">{t('projectIssues.col.created')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-sm text-text-muted">
                    {t('projectIssues.empty')}
                  </td>
                </tr>
              ) : (
                filtered.map((issue) => {
                  const statusBadge = issueStatusBadge(issue.status);
                  const priorityBadge = issuePriorityBadge(issue.priority);
                  const clickable = Boolean(issue.linkedFileItemId);
                  return (
                    <tr
                      key={issue.id}
                      onClick={() => openIssue(issue.linkedFileItemId, issue.id)}
                      className={`transition-colors ${clickable ? 'cursor-pointer hover:bg-content-bg' : ''}`}
                    >
                      <td className="px-5 py-3">
                        <p className="font-semibold text-text">{issue.title}</p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {issue.linkedFileName
                            ? `${t('projectIssues.inFile')}: ${issue.linkedFileName}`
                            : t('projectIssues.noFile')}
                          {issue.linkedFolderName ? ` · ${issue.linkedFolderName}` : ''}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityBadge.className}`}>
                          {priorityBadge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-text-secondary">
                        {issue.assignedToName ?? <span className="italic text-text-placeholder">{t('projectIssues.unassigned')}</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-text-muted">
                        {formatIssueDateTime(issue.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
