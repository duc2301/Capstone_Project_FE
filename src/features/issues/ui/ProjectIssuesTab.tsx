import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { IssuePriority, IssueStatus } from '@/entities/issue';
import type { ListTableColumn } from '@/shared/components';
import { ListErrorCard, ListLoadingCard, ListTable, PaginationBar, SearchField } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { issuePriorityBadge, issueStatusBadge } from '../model/issueFormat';
import { useProjectIssues } from '../model/useProjectIssues';
import { IssueTableRow } from './IssueTableRow';

const STATUS_FILTERS: (IssueStatus | 'all')[] = ['all', 'Open', 'InProgress', 'Answered', 'Closed'];
const PRIORITY_FILTERS: (IssuePriority | 'all')[] = ['all', 'Low', 'Medium', 'High', 'Critical'];

const PAGE_SIZE = 20;

const SELECT_CLASS = 'field-select w-auto border-card-border bg-card shadow-card';

const ISSUE_COLUMNS: ListTableColumn[] = [
  { key: 'title', label: t('projectIssues.col.title') },
  { key: 'priority', label: t('projectIssues.col.priority'), width: 'w-[120px]' },
  { key: 'status', label: t('projectIssues.col.status'), width: 'w-[130px]' },
  { key: 'assignee', label: t('projectIssues.col.assignee'), width: 'w-[170px]' },
  { key: 'created', label: t('projectIssues.col.created'), width: 'w-[150px]' },
];

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
        <SearchField
          value={query}
          onChange={(value) => changeFilter(() => setQuery(value))}
          placeholder={t('projectIssues.searchPlaceholder')}
          className="w-full lg:max-w-[420px]"
        />

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
        <ListLoadingCard />
      ) : error ? (
        <ListErrorCard message={error} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
            <ListTable columns={ISSUE_COLUMNS} minWidth="min-w-[780px]">
              <tbody className="divide-y divide-card-border">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={ISSUE_COLUMNS.length} className="px-6 py-16 text-center text-sm text-text-muted">
                      {t('projectIssues.empty')}
                    </td>
                  </tr>
                ) : (
                  paged.map((issue) => (
                    <IssueTableRow
                      key={issue.id}
                      issue={issue}
                      clickable={Boolean(issue.linkedFileItemId)}
                      onOpen={() => openIssue(issue.linkedFileItemId, issue.id)}
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
