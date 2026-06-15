import { AccountRole } from '../model/session.types';
import type { CurrentUser } from '../model/session.types';

export function isAccountAdmin(role: CurrentUser['role'] | undefined | null): boolean {
  if (role == null) return false;
  const normalized = role.toString();
  return normalized === AccountRole.Admin || normalized.toLowerCase() === 'admin';
}

export function getPostLoginPath(role: CurrentUser['role'] | undefined | null): string {
  return isAccountAdmin(role) ? '/accounts' : '/dashboard';
}
