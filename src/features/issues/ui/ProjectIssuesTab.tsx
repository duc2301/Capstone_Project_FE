import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { IssuePriority, IssueStatus } from '@/entities/issue';
import { PaginationBar } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { formatIssueDateTime, issuePriorityBadge, issueStatusBadge } from '../model/issueFormat';
import { useProjectIssues } from '../model/useProjectIssues';

const STATUS_FILTERS: (IssueStatus | 'all')[] = ['all', 'Open', 'InProgress', 'Answered', 'Closed'];
const PRIORITY_FILTERS: (IssuePriority | 'all')[] = ['all', 'Low', 'Medium', 'High', 'Critical'];

const PAGE_SIZE = 20;

const SEARCH_CLASS =
  'w-full rounded-[var(--radius-input)] border border-card-border bg-card py-2.5 pl-11 pr-10 text-sm text-text shadow-card outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';
const SELECT_CLASS =
  'rounded-[var(--radius-input)] border border-card-border bg-card px-4 py-2.5 text-sm text-text shadow-card outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20';

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
  const [page, setPage] = useState(1);

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

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changeFilter = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const openIssue = (fileItemId: string | null, issueId: string) => {
    if (!fileItemId) return;
    navigate(`/projects/${projectId}/files/${fileItemId}/issues/${issueId}`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <h2 className="heading-tab shrink-0">{t('projectDetail.tab.issues')}</h2>

      <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-[420px]">
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => changeFilter(() => setQuery(e.target.value))}
            placeholder={t('projectIssues.searchPlaceholder')}
            className={SEARCH_CLASS}
          />
          {query && (
            <button
              type="button"
              onClick={() => changeFilter(() => setQuery(''))}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <select
            className={SELECT_CLASS}
            value={status}
            onChange={(e) => changeFilter(() => setStatus(e.target.value as IssueStatus | 'all'))}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? t('projectIssues.filter.allStatus') : issueStatusBadge(s).label}
              </option>
            ))}
          </select>
          <select
            className={SELECT_CLASS}
            value={priority}
            onChange={(e) => changeFilter(() => setPriority(e.target.value as IssuePriority | 'all'))}
          >
            {PRIORITY_FILTERS.map((p) => (
              <option key={p} value={p}>
                {p === 'all' ? t('projectIssues.filter.allPriority') : issuePriorityBadge(p).label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-card-border bg-card py-20 shadow-card">
          <p className="text-sm text-text-muted">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="rounded-[var(--radius-card)] border border-danger/20 bg-danger-light p-6 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="table-head bg-content-bg">
                  <th className="px-6 py-3.5">{t('projectIssues.col.title')}</th>
                  <th className="px-5 py-3.5">{t('projectIssues.col.priority')}</th>
                  <th className="px-5 py-3.5">{t('projectIssues.col.status')}</th>
                  <th className="px-5 py-3.5">{t('projectIssues.col.assignee')}</th>
                  <th className="px-5 py-3.5">{t('projectIssues.col.created')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-text-muted">
                      {t('projectIssues.empty')}
                    </td>
                  </tr>
                ) : (
                  paged.map((issue) => {
                    const statusBadge = issueStatusBadge(issue.status);
                    const priorityBadge = issuePriorityBadge(issue.priority);
                    const clickable = Boolean(issue.linkedFileItemId);
                    return (
                      <tr
                        key={issue.id}
                        onClick={() => openIssue(issue.linkedFileItemId, issue.id)}
                        className={`transition-colors ${clickable ? 'cursor-pointer hover:bg-content-bg' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-text">{issue.title}</p>
                          <p className="mt-0.5 text-xs text-text-muted">
                            {issue.linkedFileName
                              ? `${t('projectIssues.inFile')}: ${issue.linkedFileName}`
                              : t('projectIssues.noFile')}
                            {issue.linkedFolderName ? ` · ${issue.linkedFolderName}` : ''}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityBadge.className}`}>
                            {priorityBadge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-text-secondary">
                          {issue.assignedToName ?? <span className="italic text-text-placeholder">{t('projectIssues.unassigned')}</span>}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-text-muted">
                          {formatIssueDateTime(issue.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={currentPage}
            pageCount={pageCount}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            unit={t('projectIssues.paginationUnit')}
            variant="inline"
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
