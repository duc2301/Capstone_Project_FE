import type { IssuePriority, IssueStatus } from '@/entities/issue';
import { t } from '@/shared/lib/i18n';

import { formatIssueDateTime, issuePriorityBadge, issueStatusBadge } from '../model/issueFormat';

export interface IssueRowItem {
  id: string;
  title: string;
  linkedFileName?: string | null;
  linkedFolderName?: string | null;
  priority: IssuePriority;
  status: IssueStatus;
  assignedToName?: string | null;
  assignedToGroupName?: string | null;
  createdAt: string | null;
}

interface IssueTableRowProps {
  issue: IssueRowItem;
  projectName?: string;
  clickable: boolean;
  onOpen: () => void;
}

export function IssueTableRow({ issue, projectName, clickable, onOpen }: IssueTableRowProps) {
  const statusBadge = issueStatusBadge(issue.status);
  const priorityBadge = issuePriorityBadge(issue.priority);

  return (
    <tr
      onClick={onOpen}
      className={`transition-colors ${clickable ? 'cursor-pointer hover:bg-content-bg' : ''}`}
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
      {projectName !== undefined && (
        <td className="cell-wrap px-5 py-4 align-top text-text-secondary">{projectName}</td>
      )}
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
        {issue.assignedToName ?? issue.assignedToGroupName
          ?? <span className="italic text-text-placeholder">{t('projectIssues.unassigned')}</span>}
      </td>
      <td className="px-5 py-4 align-top text-text-muted">
        {formatIssueDateTime(issue.createdAt)}
      </td>
    </tr>
  );
}
