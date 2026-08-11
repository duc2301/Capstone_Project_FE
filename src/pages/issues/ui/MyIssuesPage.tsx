import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import type { IssuePriority, IssueStatus } from '@/entities/issue';
import { useSession } from '@/entities/session';
import {
  formatIssueDateTime,
  issuePriorityBadge,
  issueStatusBadge,
  useMyIssues,
} from '@/features/issues';
import { PaginationBar } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

const STATUS_FILTERS: (IssueStatus | 'all')[] = ['all', 'Open', 'InProgress', 'Answered', 'Closed'];
const PRIORITY_FILTERS: (IssuePriority | 'all')[] = ['all', 'Low', 'Medium', 'High', 'Critical'];
const PAGE_SIZE = 20;

const SEARCH_CLASS =
  'w-full rounded-[var(--radius-input)] border border-card-border bg-card py-2.5 pl-11 pr-10 text-sm text-text shadow-card outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';
const SELECT_CLASS = 'field-select w-auto border-card-border bg-card shadow-card';

export function MyIssuesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useSession();
  const { issues, loading, error } = useMyIssues();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<IssueStatus | 'all'>('all');
  const [priority, setPriority] = useState<IssuePriority | 'all'>('all');
  const [projectId, setProjectId] = useState('all');
  const [assignee, setAssignee] = useState<'all' | 'me'>(
    searchParams.get('assignee') === 'me' ? 'me' : 'all',
  );
  const [page, setPage] = useState(1);

  const projectOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const issue of issues) byId.set(issue.projectId, issue.projectName ?? issue.projectId);
    return [...byId].map(([id, name]) => ({ id, name }));
  }, [issues]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return issues.filter((issue) => {
      if (status !== 'all' && issue.status !== status) return false;
      if (priority !== 'all' && issue.priority !== priority) return false;
      if (projectId !== 'all' && issue.projectId !== projectId) return false;
      if (assignee === 'me' && issue.assignedToAccountId !== currentUser?.accountId) return false;
      if (!keyword) return true;
      return (
        issue.title.toLowerCase().includes(keyword)
        || (issue.projectName?.toLowerCase().includes(keyword) ?? false)
        || (issue.linkedFileName?.toLowerCase().includes(keyword) ?? false)
        || (issue.assignedToName?.toLowerCase().includes(keyword) ?? false)
      );
    });
  }, [issues, query, status, priority, projectId, assignee, currentUser]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changeFilter = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const openIssue = (issue: (typeof issues)[number]) => {
    if (issue.linkedFileItemId) {
      navigate(`/projects/${issue.projectId}/files/${issue.linkedFileItemId}/issues/${issue.id}`);
      return;
    }
    navigate(`/projects/${issue.projectId}?tab=issues`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <h1 className="heading-page shrink-0">{t('myIssues.title')}</h1>

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
            placeholder={t('myIssues.searchPlaceholder')}
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
            className={`${SELECT_CLASS} max-w-52`}
            title={t('myIssues.filter.project')}
            value={projectId}
            onChange={(e) => changeFilter(() => setProjectId(e.target.value))}
          >
            <option value="all">{t('myIssues.filter.allProjects')}</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <select
            className={SELECT_CLASS}
            title={t('myIssues.filter.assignee')}
            value={assignee}
            onChange={(e) => changeFilter(() => setAssignee(e.target.value as 'all' | 'me'))}
          >
            <option value="all">{t('myIssues.filter.allAssignees')}</option>
            <option value="me">{t('myIssues.filter.assignedToMe')}</option>
          </select>
          <select
            className={SELECT_CLASS}
            title={t('projectIssues.col.status')}
            value={status}
            onChange={(e) => changeFilter(() => setStatus(e.target.value as IssueStatus | 'all'))}
          >
            {STATUS_FILTERS.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? t('projectIssues.filter.allStatus') : issueStatusBadge(item).label}
              </option>
            ))}
          </select>
          <select
            className={SELECT_CLASS}
            title={t('projectIssues.col.priority')}
            value={priority}
            onChange={(e) => changeFilter(() => setPriority(e.target.value as IssuePriority | 'all'))}
          >
            {PRIORITY_FILTERS.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? t('projectIssues.filter.allPriority') : issuePriorityBadge(item).label}
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
            <table className="table-list min-w-[900px]">
              <colgroup>
                <col />
                <col className="w-[20%]" />
                <col className="w-[120px]" />
                <col className="w-[130px]" />
                <col className="w-[160px]" />
                <col className="w-[150px]" />
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="table-head bg-content-bg">
                  <th className="px-6 py-3.5">{t('projectIssues.col.title')}</th>
                  <th className="px-5 py-3.5">{t('myIssues.col.project')}</th>
                  <th className="px-5 py-3.5">{t('projectIssues.col.priority')}</th>
                  <th className="px-5 py-3.5">{t('projectIssues.col.status')}</th>
                  <th className="px-5 py-3.5">{t('projectIssues.col.assignee')}</th>
                  <th className="px-5 py-3.5">{t('projectIssues.col.created')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-sm text-text-muted">
                      {t('myIssues.empty')}
                    </td>
                  </tr>
                ) : (
                  paged.map((issue) => {
                    const statusBadge = issueStatusBadge(issue.status);
                    const priorityBadge = issuePriorityBadge(issue.priority);
                    return (
                      <tr
                        key={issue.id}
                        onClick={() => openIssue(issue)}
                        className="cursor-pointer transition-colors hover:bg-content-bg"
                      >
                        <td className="px-6 py-4 align-top">
                          <p className="cell-wrap font-semibold text-text">{issue.title}</p>
                          <p className="cell-wrap mt-0.5 text-xs text-text-muted">
                            {issue.linkedFileName
                              ? `${t('projectIssues.inFile')}: ${issue.linkedFileName}`
                              : t('projectIssues.noFile')}
                            {issue.linkedFolderName ? ` · ${issue.linkedFolderName}` : ''}
                          </p>
                        </td>
                        <td className="cell-wrap px-5 py-4 align-top text-text-secondary">{issue.projectName ?? '—'}</td>
                        <td className="px-5 py-4 align-top">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityBadge.className}`}>
                            {priorityBadge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="cell-wrap px-5 py-4 align-top text-text-secondary">
                          {issue.assignedToName ?? (
                            <span className="italic text-text-placeholder">{t('projectIssues.unassigned')}</span>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top text-text-muted">
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
