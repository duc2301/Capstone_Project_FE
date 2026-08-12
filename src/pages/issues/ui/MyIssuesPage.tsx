import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import type { IssuePriority, IssueStatus } from '@/entities/issue';
import { useSession } from '@/entities/session';
import {
  issuePriorityBadge,
  issueStatusBadge,
  IssueTableRow,
  useMyIssues,
} from '@/features/issues';
import type { ListTableColumn } from '@/shared/components';
import { ListErrorCard, ListLoadingCard, ListTable, PaginationBar, SearchField } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

const STATUS_FILTERS: (IssueStatus | 'all')[] = ['all', 'Open', 'InProgress', 'Answered', 'Closed'];
const PRIORITY_FILTERS: (IssuePriority | 'all')[] = ['all', 'Low', 'Medium', 'High', 'Critical'];
const PAGE_SIZE = 20;

const SELECT_CLASS = 'field-select w-auto border-card-border bg-card shadow-card';

const MY_ISSUE_COLUMNS: ListTableColumn[] = [
  { key: 'title', label: t('projectIssues.col.title') },
  { key: 'project', label: t('myIssues.col.project'), width: 'w-[20%]' },
  { key: 'priority', label: t('projectIssues.col.priority'), width: 'w-[120px]' },
  { key: 'status', label: t('projectIssues.col.status'), width: 'w-[130px]' },
  { key: 'assignee', label: t('projectIssues.col.assignee'), width: 'w-[160px]' },
  { key: 'created', label: t('projectIssues.col.created'), width: 'w-[150px]' },
];

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
        <SearchField
          value={query}
          onChange={(value) => changeFilter(() => setQuery(value))}
          placeholder={t('myIssues.searchPlaceholder')}
          className="w-full lg:max-w-[420px]"
        />

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
        <ListLoadingCard />
      ) : error ? (
        <ListErrorCard message={error} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
            <ListTable columns={MY_ISSUE_COLUMNS} minWidth="min-w-[900px]">
              <tbody className="divide-y divide-card-border">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={MY_ISSUE_COLUMNS.length} className="px-6 py-16 text-center text-sm text-text-muted">
                      {t('myIssues.empty')}
                    </td>
                  </tr>
                ) : (
                  paged.map((issue) => (
                    <IssueTableRow
                      key={issue.id}
                      issue={issue}
                      projectName={issue.projectName ?? '—'}
                      clickable
                      onOpen={() => openIssue(issue)}
                    />
                  ))
                )}
              </tbody>
            </ListTable>
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
