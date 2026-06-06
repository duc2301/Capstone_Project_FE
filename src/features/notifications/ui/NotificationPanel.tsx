import { useState } from 'react';

import type { NotificationItem } from '@/entities/notification';
import { useNotifications } from '@/entities/notification';
import { t } from '@/shared/lib/i18n';
import { useInvitationActions } from '../model/useInvitationActions';
import { usePendingInvitations } from '../model/usePendingInvitations';
import { NotificationRow } from './NotificationRow';

interface Props {
  variant?: 'dropdown' | 'page';
}

const INVITATION_LINK_TYPE = 'ProjectInvitation';

export function NotificationPanel({ variant = 'dropdown' }: Props) {
  const { notifications, loading, markRead, refresh } = useNotifications();
  const { pendingIds, refreshPending } = usePendingInvitations();
  const { processingId, processingAction, respond } = useInvitationActions(() => {
    void refresh();
    void refreshPending();
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isPendingInvite = (n: NotificationItem): boolean =>
    n.linkType === INVITATION_LINK_TYPE && !!n.linkId && pendingIds.has(n.linkId);

  const handleToggle = (n: NotificationItem) => {
    if (!n.isRead) void markRead(n.id);
    setExpandedId((cur) => (cur === n.id ? null : n.id));
  };

  const listClass =
    variant === 'dropdown' ? 'max-h-[60vh] overflow-y-auto' : 'overflow-y-auto';

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
        <h2 className="font-heading text-sm font-bold text-text">{t('notification.title')}</h2>
      </div>

      {loading && notifications.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-text-muted">{t('common.loading')}</div>
      ) : notifications.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-text-muted">{t('notification.empty')}</div>
      ) : (
        <ul className={listClass}>
          {notifications.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              expanded={expandedId === n.id}
              isPendingInvite={isPendingInvite(n)}
              processingAction={processingId === n.linkId ? processingAction : null}
              onToggle={() => handleToggle(n)}
              onAccept={() => n.linkId && respond(n.linkId, 'accept')}
              onReject={() => n.linkId && respond(n.linkId, 'reject')}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
