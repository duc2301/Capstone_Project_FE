import { NotificationFeed } from '@/features/notifications';
import { t } from '@/shared/lib/i18n';

export function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text lg:text-3xl">
          {t('notification.title')}
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t('notification.page.subtitle')}</p>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card">
        <NotificationFeed />
      </div>
    </div>
  );
}
