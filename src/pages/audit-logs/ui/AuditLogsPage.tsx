import { AuditLogPanel } from '@/features/audit-logs';
import { t } from '@/shared/lib/i18n';

/* Nhật ký hoạt động toàn hệ thống — CHỈ Admin (route đã bọc RequireAdmin).
 * Thấy log của mọi dự án; lọc theo phạm vi/hành động/khoảng ngày ở panel. */
export function AuditLogsPage() {
  return (
    <AuditLogPanel
      mode="system"
      heading={<h1 className="heading-page shrink-0">{t('audit.page.title')}</h1>}
    />
  );
}
