import type { NotificationItem } from '@/entities/notification';
import { t } from '@/shared/lib/i18n';
import { formatDateTime, formatRelativeTime } from '../model/formatTime';
import type { InvitationAction } from '../model/useInvitationActions';

interface Props {
  notification: NotificationItem;
  expanded: boolean;
  isPendingInvite: boolean;
  processingAction: InvitationAction | null;
  onToggle: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export function NotificationRow({
  notification,
  expanded,
  isPendingInvite,
  processingAction,
  onToggle,
  onAccept,
  onReject,
}: Props) {
  const { message, senderName, sendAt, isRead } = notification;
  const processing = processingAction !== null;

  return (
    <li className={`border-b border-card-border last:border-b-0 ${isRead ? '' : 'bg-primary-ghost'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-content-bg"
      >
        {/* Chấm chưa đọc */}
        <span className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center">
          {!isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
        </span>

        <span className="min-w-0 flex-1">
          <span className={`block text-sm leading-snug text-text ${isRead ? '' : 'font-semibold'}`}>
            {message}
          </span>
          <span className="mt-1 flex items-center gap-2 text-xs text-text-muted">
            <span className="truncate">{senderName}</span>
            <span>·</span>
            <span className="shrink-0">{formatRelativeTime(sendAt)}</span>
          </span>
        </span>

        {isPendingInvite && (
          <span className="shrink-0 rounded-[var(--radius-badge)] bg-warning-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
            {t('notification.invitation.badge')}
          </span>
        )}
      </button>

      {expanded && (
        <div className="space-y-3 bg-content-bg/60 px-4 pb-4 pt-1">
          <p className="text-xs text-text-muted">{formatDateTime(sendAt)}</p>

          {isPendingInvite && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onAccept}
                disabled={processing}
                className="rounded-[var(--radius-button)] bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {processingAction === 'accept'
                  ? t('common.loading')
                  : t('notification.invitation.accept')}
              </button>
              <button
                type="button"
                onClick={onReject}
                disabled={processing}
                className="rounded-[var(--radius-button)] border border-danger/40 bg-danger-light px-4 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
              >
                {processingAction === 'reject'
                  ? t('common.loading')
                  : t('notification.invitation.reject')}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
