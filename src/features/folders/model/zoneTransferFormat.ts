import { CdeArea } from '@/entities/folder';
import type { ZoneName, ZoneReturnRequestStatus } from '@/entities/zone-transfer';
import { t } from '@/shared/lib/i18n';

const ZONE_NAME_BY_AREA: Record<CdeArea, ZoneName> = {
  [CdeArea.Wip]: 'Wip',
  [CdeArea.Shared]: 'Shared',
  [CdeArea.Published]: 'Published',
  [CdeArea.Archived]: 'Archived',
};

const ZONE_LABELS: Record<ZoneName, string> = {
  Wip: 'WIP',
  Shared: 'Shared',
  Published: 'Published',
  Archived: 'Archived',
};

export function zoneNameFromArea(area: CdeArea): ZoneName {
  return ZONE_NAME_BY_AREA[area];
}

export function zoneLabel(zone: ZoneName): string {
  return ZONE_LABELS[zone];
}

export function returnRequestStatusBadge(status: ZoneReturnRequestStatus): { label: string; className: string } {
  switch (status) {
    case 'Approved':
      return { label: t('documents.status.approved'), className: 'bg-success-light text-success' };
    case 'Rejected':
      return { label: t('documents.status.rejected'), className: 'bg-danger-light text-danger' };
    default:
      return { label: t('returnRequests.status.pending'), className: 'bg-warning-light text-warning' };
  }
}
