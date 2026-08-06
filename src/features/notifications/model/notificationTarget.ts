import { DiscussionScopeType, discussionApi } from '@/entities/discussion';
import { fileItemApi } from '@/entities/file-item';
import { markupApi } from '@/entities/file-note';
import { issueApi } from '@/entities/issue';
import type { NotificationItem } from '@/entities/notification';
import { approvalApi } from '@/entities/approval';

const LINK_TYPE = {
  projectInvitation: 'ProjectInvitation',
  project: 'Project',
  issue: 'Issue',
  approval: 'Approval',
  discussion: 'Discussion',
  markup: 'Markup',
  group: 'Group',
} as const;

const NAVIGABLE_TYPES = new Set<string>([
  LINK_TYPE.project,
  LINK_TYPE.issue,
  LINK_TYPE.approval,
  LINK_TYPE.discussion,
  LINK_TYPE.markup,
]);

export function isNavigable(notification: NotificationItem): boolean {
  return Boolean(notification.linkId) && NAVIGABLE_TYPES.has(notification.linkType ?? '');
}

async function fileViewPath(fileItemId: string, panel?: string): Promise<string | null> {
  const { data } = await fileItemApi.getView(fileItemId);
  if (!data.isSuccess || !data.result?.projectId) return null;

  const folderQuery = data.result.folderId ? `?folder=${data.result.folderId}` : '';
  const panelQuery = panel ? `${folderQuery ? '&' : '?'}panel=${panel}` : '';
  return `/projects/${data.result.projectId}/files/${fileItemId}/view${folderQuery}${panelQuery}`;
}

async function issuePath(issueId: string): Promise<string | null> {
  const issue = await issueApi.getById(issueId);
  if (!issue) return null;

  if (!issue.linkedFileItemId) return `/projects/${issue.projectId}?tab=issues`;

  const folderQuery = issue.linkedFolderId ? `?folder=${issue.linkedFolderId}` : '';
  return `/projects/${issue.projectId}/files/${issue.linkedFileItemId}/issues/${issueId}${folderQuery}`;
}

export async function resolveNotificationTarget(
  notification: NotificationItem,
): Promise<string | null> {
  const { linkType, linkId } = notification;
  if (!linkId) return null;

  try {
    switch (linkType) {
      case LINK_TYPE.project:
        return `/projects/${linkId}`;

      case LINK_TYPE.issue:
        return await issuePath(linkId);

      case LINK_TYPE.approval: {
        const approval = await approvalApi.getApprovalDetail(linkId);
        return approval?.fileItemId ? await fileViewPath(approval.fileItemId, 'signatureHistory') : null;
      }

      case LINK_TYPE.markup: {
        const { data } = await markupApi.getSetDetail(linkId);
        const set = data.isSuccess ? data.result : null;
        return set?.fileItemId ? await fileViewPath(set.fileItemId) : null;
      }

      case LINK_TYPE.discussion: {
        const discussion = await discussionApi.getById(linkId);
        if (!discussion) return null;
        if (discussion.scopeType === DiscussionScopeType.Issue && discussion.scopeId) {
          return await issuePath(discussion.scopeId);
        }
        return `/projects/${discussion.projectId}`;
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}
