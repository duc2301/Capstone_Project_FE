export const ACCOUNT_ROLES = ['Admin', 'User'] as const;
export type AccountRoleName = (typeof ACCOUNT_ROLES)[number];

export const ACCOUNT_STATUSES = ['Active', 'Inactive', 'Suspended', 'PendingVerification'] as const;
export type AccountStatusName = (typeof ACCOUNT_STATUSES)[number];

export const ACCOUNT_ASSIGNABLE_STATUSES = ['Active', 'Suspended'] as const;

export interface AccountManagedProject {
  projectId: string;
  projectName: string;
}

export interface Account {
  id: string;
  userName: string;
  email: string;
  role: string | null;
  status: string | null;
  organizationId: string | null;
  organizationName: string | null;
  avatarUrl: string | null;
  managedProjects: AccountManagedProject[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateAccountPayload {
  userName: string;
  email: string;
  password: string;
  role?: string;
  organizationId?: string;
}

export interface UpdateAccountPayload {
  userName?: string;
  email?: string;
  role?: string;
  status?: string;
  organizationId?: string;
  clearOrganization?: boolean;
}
