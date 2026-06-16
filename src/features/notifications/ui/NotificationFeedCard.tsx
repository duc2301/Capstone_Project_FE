import type { NotificationItem, NotificationLinkType } from '@/entities/notification';
import { t } from '@/shared/lib/i18n';
import { formatRelativeTime } from '../model/formatTime';
import type { InvitationAction } from '../model/useInvitationActions';

interface Props {
  notification: NotificationItem;
  isPendingInvite: boolean;
  processingAction: InvitationAction | null;
  onOpen: () => void;
  onAccept: () => void;
  onReject: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getCategoryLabel(linkType?: NotificationLinkType | null): string | null {
  if (linkType === 'ProjectInvitation') return t('notification.category.invitation');
  if (linkType === 'Project') return t('notification.category.project');
  if (linkType === 'Group') return t('notification.category.group');
  return null;
}

export function NotificationFeedCard({
  notification,
  isPendingInvite,
  processingAction,
  onOpen,
  onAccept,
  onReject,
}: Props) {
  const { message, senderName, sendAt, isRead, linkType } = notification;
  const processing = processingAction !== null;
  const category = getCategoryLabel(linkType);

  return (
    <div
      className={`relative flex items-center gap-5 rounded-3xl border bg-card p-5 transition-shadow duration-200 hover:shadow-card ${
        isRead ? 'border-card-border' : 'border-primary/25'
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-5 text-left"
      >
        {/* Avatar + chấm chưa đọc */}
        <span className="relative shrink-0">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-base font-bold text-primary">
            {getInitials(senderName)}
          </span>
          {!isRead && (
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-card" />
          )}
        </span>

        {/* Nội dung */}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-3">
            <span
              className={`truncate text-base text-text ${isRead ? 'font-medium' : 'font-bold'}`}
            >
              {senderName}
            </span>
            {category && (
              <>
                <span className="text-xs text-text-muted">·</span>
                <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-primary">
                  {category}
                </span>
              </>
            )}
          </span>
          <span
            className={`text-[15px] leading-snug text-text ${isRead ? 'font-medium' : 'font-semibold'}`}
          >
            {message}
          </span>
          <span className="text-xs font-medium text-text-muted">
            {formatRelativeTime(sendAt)}
          </span>
        </span>
      </button>

      {/* Hành động cho lời mời đang chờ */}
      {isPendingInvite && (
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onAccept}
            disabled={processing}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {processingAction === 'accept'
              ? t('common.loading')
              : t('notification.invitation.accept')}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={processing}
            className="rounded-xl bg-content-bg px-4 py-2 text-xs font-medium text-text transition-colors hover:bg-card-border disabled:opacity-50"
          >
            {processingAction === 'reject'
              ? t('common.loading')
              : t('notification.invitation.reject')}
          </button>
        </div>
      )}
    </div>
  );
}
