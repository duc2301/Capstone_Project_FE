/* ── OrganizationType ─────────────────────────────── */
export interface OrganizationType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface CreateOrganizationTypePayload {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateOrganizationTypePayload {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}
