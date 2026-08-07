import { NotificationFeed } from '@/features/notifications';
import { t } from '@/shared/lib/i18n';

export function NotificationsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <h1 className="heading-page shrink-0">{t('notification.title')}</h1>
      <NotificationFeed />
    </div>
  );
}
