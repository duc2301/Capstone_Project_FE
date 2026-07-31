import { AuditLogPanel } from '@/features/audit-logs';
import { t } from '@/shared/lib/i18n';

/* Nhật ký hoạt động toàn hệ thống — CHỈ Admin (route đã bọc RequireAdmin).
 * Thấy log của mọi dự án; lọc theo phạm vi/hành động/khoảng ngày ở panel. */
export function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-text lg:text-4xl">{t('audit.page.title')}</h1>
        <p className="mt-1.5 text-sm text-text-muted">{t('audit.page.desc')}</p>
      </div>

      <AuditLogPanel mode="system" />
    </div>
  );
}
