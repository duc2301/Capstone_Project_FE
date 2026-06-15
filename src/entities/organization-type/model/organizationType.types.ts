/* ── OrganizationType ──────────────────────────────── */
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
}
