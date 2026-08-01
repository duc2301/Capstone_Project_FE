import { NotificationFeed } from '@/features/notifications';
import { t } from '@/shared/lib/i18n';

export function NotificationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="heading-page">
        {t('notification.title')}
      </h1>

      <div className="overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card">
        <NotificationFeed />
      </div>
    </div>
  );
}
