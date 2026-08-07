import type { NotificationItem, NotificationLinkType } from '@/entities/notification';
import { t } from '@/shared/lib/i18n';
import { formatRelativeTime } from '@/shared/lib/format';
import type { InvitationAction } from '../model/useInvitationActions';

interface Props {
  notification: NotificationItem;
  count: number;
  hasUnread: boolean;
  navigable: boolean;
  isPendingInvite: boolean;
  processingAction: InvitationAction | null;
  onOpen: () => void;
  onAccept: () => void;
  onReject: () => void;
}

const CATEGORY_KEY: Record<string, Parameters<typeof t>[0]> = {
  ProjectInvitation: 'notification.category.invitation',
  Project: 'notification.category.project',
  Group: 'notification.category.group',
  Issue: 'notification.category.issue',
  Approval: 'notification.category.approval',
  Discussion: 'notification.category.discussion',
  Markup: 'notification.category.markup',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function categoryLabel(linkType?: NotificationLinkType | null): string | null {
  const key = linkType ? CATEGORY_KEY[linkType] : undefined;
  return key ? t(key) : null;
}

export function NotificationRowItem({
  notification,
  count,
  hasUnread,
  navigable,
  isPendingInvite,
  processingAction,
  onOpen,
  onAccept,
  onReject,
}: Props) {
  const { message, senderName, sendAt, linkType } = notification;
  const processing = processingAction !== null;
  const category = categoryLabel(linkType);
  const clickable = navigable || hasUnread;

  return (
    <div
      onClick={clickable ? onOpen : undefined}
      className={`flex items-center gap-4 px-6 py-4 transition-colors ${
        hasUnread ? 'bg-primary-ghost/40' : ''
      } ${clickable ? 'cursor-pointer hover:bg-content-bg' : ''}`}
    >
      <span className="relative shrink-0">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
          {getInitials(senderName)}
        </span>
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-primary ring-2 ring-card" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`truncate text-sm text-text ${hasUnread ? 'font-bold' : 'font-medium'}`}>
            {senderName}
          </span>
          {category && (
            <span className="shrink-0 rounded-[var(--radius-badge)] bg-primary/10 px-2 py-0.5 text-2xs font-bold uppercase tracking-wide text-primary">
              {category}
            </span>
          )}
          {count > 1 && (
            <span className="shrink-0 rounded-[var(--radius-badge)] bg-info-light px-2 py-0.5 text-2xs font-bold text-info">
              {t('notification.groupCount').replace('{count}', String(count))}
            </span>
          )}
        </div>
        <p className={`mt-0.5 truncate text-sm text-text ${hasUnread ? 'font-semibold' : ''}`}>
          {message}
        </p>
        <p className="mt-0.5 text-xs text-text-muted">{formatRelativeTime(sendAt)}</p>
      </div>

      {isPendingInvite && (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAccept(); }}
            disabled={processing}
            className="rounded-[var(--radius-button)] bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {processingAction === 'accept' ? t('common.loading') : t('notification.invitation.accept')}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onReject(); }}
            disabled={processing}
            className="rounded-[var(--radius-button)] border border-card-border bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-50"
          >
            {processingAction === 'reject' ? t('common.loading') : t('notification.invitation.reject')}
          </button>
        </div>
      )}

      {navigable && !isPendingInvite && (
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0 text-text-placeholder"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </div>
  );
}
