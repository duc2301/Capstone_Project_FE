import { useCallback } from 'react';

import type { NotificationItem } from '@/entities/notification';
import { useNotifications } from '@/entities/notification';
import { t } from '@/shared/lib/i18n';
import { useInvitationActions } from '../model/useInvitationActions';
import { useNotificationFeed } from '../model/useNotificationFeed';
import { usePendingInvitations } from '../model/usePendingInvitations';
import { NotificationFeedCard } from './NotificationFeedCard';
import { NotificationFeedToolbar } from './NotificationFeedToolbar';
import { NotificationPagination } from './NotificationPagination';

const INVITATION_LINK_TYPE = 'ProjectInvitation';

export function NotificationFeed() {
  const { notifications, unreadCount, loading, markRead, markAllRead, refresh } =
    useNotifications();
  const { pendingIds, refreshPending } = usePendingInvitations();

  const handleResponded = useCallback(() => {
    void refresh();
    void refreshPending();
  }, [refresh, refreshPending]);

  const { processingId, processingAction, respond } = useInvitationActions(handleResponded);

  const isPendingInvite = useCallback(
    (n: NotificationItem): boolean =>
      n.linkType === INVITATION_LINK_TYPE && !!n.linkId && pendingIds.has(n.linkId),
    [pendingIds],
  );

  const feed = useNotificationFeed({ notifications, isPendingInvite });

  const handleOpen = (n: NotificationItem) => {
    if (!n.isRead) void markRead(n.id);
  };

  const showEmpty = !loading && feed.totalFiltered === 0;
  const hasAnyNotification = notifications.length > 0;

  return (
    <div className="flex flex-col">
      <NotificationFeedToolbar
        query={feed.query}
        onQueryChange={feed.setQuery}
        filter={feed.filter}
        onFilterChange={feed.setFilter}
        dateRange={feed.dateRange}
        onDateRangeChange={feed.setDateRange}
        hasUnread={unreadCount > 0}
        onMarkAllRead={() => void markAllRead()}
        onRefresh={() => void refresh()}
      />

      <div className="flex flex-col gap-4 px-6 py-6 lg:px-8">
        {loading && !hasAnyNotification ? (
          <p className="py-16 text-center text-sm text-text-muted">{t('common.loading')}</p>
        ) : showEmpty ? (
          <p className="py-16 text-center text-sm text-text-muted">
            {hasAnyNotification ? t('notification.noResults') : t('notification.empty')}
          </p>
        ) : (
          <>
            {feed.visible.map((n) => (
              <NotificationFeedCard
                key={n.id}
                notification={n}
                isPendingInvite={isPendingInvite(n)}
                processingAction={processingId === n.linkId ? processingAction : null}
                onOpen={() => handleOpen(n)}
                onAccept={() => n.linkId && respond(n.linkId, 'accept')}
                onReject={() => n.linkId && respond(n.linkId, 'reject')}
              />
            ))}

            <NotificationPagination
              page={feed.page}
              pageCount={feed.pageCount}
              onChange={feed.setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
