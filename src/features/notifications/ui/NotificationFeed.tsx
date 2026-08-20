import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { NotificationItem } from '@/entities/notification';
import { useNotifications } from '@/entities/notification';
import { PaginationBar } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import { isNavigable, resolveNotificationTarget } from '../model/notificationTarget';
import { useInvitationActions } from '../model/useInvitationActions';
import { useIssueAssignmentActions } from '../model/useIssueAssignmentActions';
import { NOTIFICATION_PAGE_SIZE, useNotificationList } from '../model/useNotificationList';
import { usePendingInvitations } from '../model/usePendingInvitations';
import { usePendingIssueAssignments } from '../model/usePendingIssueAssignments';
import { IssueRejectReasonModal } from './IssueRejectReasonModal';
import { NotificationFeedToolbar } from './NotificationFeedToolbar';
import { NotificationRowItem } from './NotificationRowItem';

const INVITATION_LINK_TYPE = 'ProjectInvitation';
const ISSUE_LINK_TYPE = 'Issue';

export function NotificationFeed() {
  const navigate = useNavigate();
  const { unreadCount, markRead, markAllRead, refresh: refreshBell } = useNotifications();
  const { pendingIds, refreshPending } = usePendingInvitations();
  const { pendingById, refreshPendingIssues } = usePendingIssueAssignments();
  const list = useNotificationList();
  const [rejectTarget, setRejectTarget] = useState<NotificationItem | null>(null);

  const handleResponded = useCallback(() => {
    void list.reload();
    void refreshBell();
    void refreshPending();
  }, [list, refreshBell, refreshPending]);

  const handleAssignmentResponded = useCallback(() => {
    void list.reload();
    void refreshBell();
    void refreshPendingIssues();
  }, [list, refreshBell, refreshPendingIssues]);

  const { processingId, processingAction, error: invitationError, respond } = useInvitationActions(handleResponded);
  const assignment = useIssueAssignmentActions(handleAssignmentResponded);

  const isPendingInvite = useCallback(
    (n: NotificationItem): boolean =>
      n.linkType === INVITATION_LINK_TYPE && !!n.linkId && pendingIds.has(n.linkId),
    [pendingIds],
  );

  const isPendingAssignment = useCallback(
    (n: NotificationItem): boolean =>
      n.linkType === ISSUE_LINK_TYPE && !!n.linkId && pendingById.has(n.linkId),
    [pendingById],
  );

  const actionOf = useCallback(
    (n: NotificationItem) => {
      if (processingId === n.linkId) return processingAction;
      if (assignment.processingId === n.linkId) return assignment.processingAction;
      return null;
    },
    [processingId, processingAction, assignment.processingId, assignment.processingAction],
  );

  const handleOpen = useCallback(async (ids: string[], head: NotificationItem) => {
    await Promise.all(ids.map((id) => markRead(id)));
    void list.reload();

    const target = await resolveNotificationTarget(head);
    if (target) navigate(target);
  }, [markRead, list, navigate]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
    void list.reload();
  }, [markAllRead, list]);

  const showEmpty = !list.loading && list.groups.length === 0;
  const actionError = invitationError ?? assignment.error;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <NotificationFeedToolbar
        query={list.query}
        onQueryChange={list.setQuery}
        filter={list.filter}
        onFilterChange={list.setFilter}
        dateRange={list.dateRange}
        onDateRangeChange={list.setDateRange}
        hasUnread={unreadCount > 0}
        onMarkAllRead={() => void handleMarkAllRead()}
        onRefresh={() => void list.reload()}
      />

      {list.error ? (
        <div className="rounded-[var(--radius-card)] border border-danger/20 bg-danger-light p-6 text-center">
          <p className="text-sm font-medium text-danger">{list.error}</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
          {actionError && (
            <p className="border-b border-danger/20 bg-danger-light px-6 py-2.5 text-sm font-medium text-danger">
              {actionError}
            </p>
          )}

          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
            {list.loading && list.groups.length === 0 ? (
              <p className="py-20 text-center text-sm text-text-muted">{t('common.loading')}</p>
            ) : showEmpty ? (
              <p className="py-20 text-center text-sm text-text-muted">
                {list.query || list.filter !== 'all' || list.dateRange.preset !== 'all'
                  ? t('notification.noResults')
                  : t('notification.empty')}
              </p>
            ) : (
              <div className="divide-y divide-card-border/60">
                {list.groups.map((group) => (
                  <NotificationRowItem
                    key={group.key + group.head.id}
                    notification={group.head}
                    count={group.count}
                    hasUnread={group.hasUnread}
                    navigable={isNavigable(group.head)}
                    isPendingInvite={isPendingInvite(group.head)}
                    isPendingAssignment={isPendingAssignment(group.head)}
                    processingAction={actionOf(group.head)}
                    onOpen={() => void handleOpen(group.ids, group.head)}
                    onAccept={() => group.head.linkId && respond(group.head.linkId, 'accept')}
                    onReject={() => group.head.linkId && respond(group.head.linkId, 'reject')}
                    onAcceptAssignment={() => group.head.linkId && void assignment.accept(group.head.linkId)}
                    onRejectAssignment={() => setRejectTarget(group.head)}
                  />
                ))}
              </div>
            )}
          </div>

          {rejectTarget?.linkId && (
            <IssueRejectReasonModal
              issueTitle={pendingById.get(rejectTarget.linkId)?.title ?? rejectTarget.message}
              busy={assignment.processingAction === 'reject'}
              onClose={() => setRejectTarget(null)}
              onSubmit={(reason) => {
                const issueId = rejectTarget.linkId!;
                setRejectTarget(null);
                void assignment.reject(issueId, reason);
              }}
            />
          )}

          <PaginationBar
            page={list.page}
            pageCount={list.pageCount}
            pageSize={NOTIFICATION_PAGE_SIZE}
            total={list.total}
            unit={t('notification.pagination.unit')}
            variant="inline"
            onChange={list.setPage}
          />
        </div>
      )}
    </div>
  );
}
