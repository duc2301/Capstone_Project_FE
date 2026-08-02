import { AuditLogPanel } from '@/features/audit-logs';
import { t } from '@/shared/lib/i18n';

/* Nhật ký hoạt động toàn hệ thống — CHỈ Admin (route đã bọc RequireAdmin).
 * Thấy log của mọi dự án; lọc theo phạm vi/hành động/khoảng ngày ở panel. */
export function AuditLogsPage() {
  return (
    <div className="space-y-6 pb-8">
      <h1 className="heading-page">{t('audit.page.title')}</h1>

      <AuditLogPanel mode="system" subtitle={t('audit.subtitle.system')} />
    </div>
  );
}
