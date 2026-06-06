import { t } from '@/shared/lib/i18n';

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSec < 60) return t('notification.time.justNow');

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} ${t('notification.time.minutesAgo')}`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ${t('notification.time.hoursAgo')}`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ${t('notification.time.daysAgo')}`;

  return date.toLocaleDateString('vi-VN');
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN');
}
