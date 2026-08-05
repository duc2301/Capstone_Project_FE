import { useState } from 'react';
import { Link } from 'react-router-dom';

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
const DROPDOWN_PREVIEW_COUNT = 5;

export function NotificationPanel({ variant = 'dropdown' }: Props) {
  const { notifications, unreadCount, loading, markRead, refresh } = useNotifications();
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
    variant === 'dropdown' ? 'max-h-[50vh] overflow-y-auto' : 'overflow-y-auto';
  const all = notifications ?? [];
  const shown = variant === 'dropdown' ? all.slice(0, DROPDOWN_PREVIEW_COUNT) : all;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-card-border px-4 py-3">
        <h2 className="heading-label">{t('notification.title')}</h2>
        {unreadCount > 0 && (
          <span className="rounded-[var(--radius-badge)] bg-primary/10 px-2 py-0.5 text-2xs font-bold text-primary">
            {t('notification.unreadBadge').replace('{count}', String(unreadCount))}
          </span>
        )}
      </div>

      {loading && all.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-text-muted">{t('common.loading')}</div>
      ) : all.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-text-muted">{t('notification.empty')}</div>
      ) : (
        <ul className={listClass}>
          {shown.map((n) => (
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

      {variant === 'dropdown' && (
        <Link
          to="/notifications"
          className="border-t border-card-border px-4 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-content-bg"
        >
          {t('notification.viewAll')}
        </Link>
      )}
    </div>
  );
}
