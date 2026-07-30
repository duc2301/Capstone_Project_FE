import type { Account, AccountRoleName, AccountStatusName } from '@/entities/account';
import { t } from '@/shared/lib/i18n';
import type { TranslationKey } from '@/shared/lib/i18n';

/* 3 mức hiển thị: Admin (Account.Role) · PM (cấp dự án, suy từ managedProjects) · Người dùng. */
const ROLE_LABEL: Record<AccountRoleName, TranslationKey> = {
  Admin: 'account.role.admin',
  User: 'account.role.user',
};

const STATUS_META: Record<AccountStatusName, { key: TranslationKey; dot: string; text: string }> = {
  Active: { key: 'account.status.active', dot: 'bg-primary', text: 'text-text' },
  Inactive: { key: 'account.status.inactive', dot: 'bg-text-placeholder', text: 'text-text-muted' },
  Suspended: { key: 'account.status.suspended', dot: 'bg-danger', text: 'text-danger' },
  PendingVerification: { key: 'account.status.pending', dot: 'bg-warning', text: 'text-warning' },
};

const isRoleName = (value: string): value is AccountRoleName => value in ROLE_LABEL;
const isStatusName = (value: string): value is AccountStatusName => value in STATUS_META;

export function roleLabel(role: string | null): string {
  if (!role) return t('account.role.user');
  return isRoleName(role) ? t(ROLE_LABEL[role]) : role;
}

export function isAdmin(account: Account): boolean {
  return account.role === 'Admin';
}

export function isProjectManager(account: Account): boolean {
  return account.managedProjects.length > 0;
}

/** Nhãn phụ dưới badge PM: tên dự án đang quản lý, nhiều dự án thì rút gọn "+n". */
export function managedProjectsLabel(account: Account): string {
  const [first, ...rest] = account.managedProjects;
  if (!first) return '';
  return rest.length === 0 ? first.projectName : `${first.projectName} +${rest.length}`;
}

export function statusMeta(status: string | null) {
  if (status && isStatusName(status)) {
    const meta = STATUS_META[status];
    return { label: t(meta.key), dotClass: meta.dot, textClass: meta.text };
  }
  return {
    label: status ?? t('account.status.unknown'),
    dotClass: 'bg-text-placeholder',
    textClass: 'text-text-muted',
  };
}
