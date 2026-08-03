import type { PackageStatus } from '@/entities/contractPackage';
import { PackageStatus as Status } from '@/entities/contractPackage';
import { t } from '@/shared/lib/i18n';
import type { TranslationKey } from '@/shared/lib/i18n';

const STATUS_META: Record<PackageStatus, { key: TranslationKey; badgeClass: string }> = {
  [Status.Draft]: { key: 'packages.status.draft', badgeClass: 'bg-content-bg text-text-muted' },
  [Status.Pending]: { key: 'packages.status.pending', badgeClass: 'bg-warning-light text-warning' },
  [Status.Active]: { key: 'packages.status.active', badgeClass: 'bg-success-light text-success' },
  [Status.Completed]: { key: 'packages.status.completed', badgeClass: 'bg-primary-light text-primary' },
  [Status.Suspended]: { key: 'packages.status.suspended', badgeClass: 'bg-danger-light text-danger' },
  [Status.Reviewing]: { key: 'packages.status.reviewing', badgeClass: 'bg-info-light text-info' },
};

export function packageStatusMeta(status: number) {
  const meta = STATUS_META[status as PackageStatus] ?? STATUS_META[Status.Draft];
  return { label: t(meta.key), badgeClass: meta.badgeClass };
}
