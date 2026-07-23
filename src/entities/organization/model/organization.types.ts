/* ── Organization ─────────────────────────────────── */
export interface Organization {
  id: string;
  taxCode: string;
  legalName: string;
  displayName: string | null;
  organizationTypeId: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isJointVenture?: boolean;
  jointVentureMemberIds?: string[];
  representativeOrganizationId?: string | null;
}

export interface CreateOrganizationPayload {
  taxCode: string;
  legalName: string;
  displayName?: string;
  organizationTypeId: string;
  address?: string;
  phone?: string;
  email?: string;
  isJointVenture?: boolean;
  jointVentureMemberIds?: string[];
  representativeOrganizationId?: string;
}

export interface UpdateOrganizationPayload {
  taxCode?: string;
  legalName?: string;
  displayName?: string;
  organizationTypeId?: string;
  address?: string;
  phone?: string;
  email?: string;
  isJointVenture?: boolean;
  jointVentureMemberIds?: string[];
  representativeOrganizationId?: string | null;
}
