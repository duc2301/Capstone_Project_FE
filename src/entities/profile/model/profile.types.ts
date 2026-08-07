/* ── Profile ──────────────────────────────────────── */
export interface ProfileGroupProject {
  projectId: string;
  projectName: string;
}

export interface ProfileGroup {
  groupId: string;
  groupName: string;
  role: string;       // Leader | Member
  joinedAt: string | null;
  organizationName: string | null;
  projects: ProfileGroupProject[];
}

export interface Profile {
  id: string;
  userName: string;
  email: string;
  role: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  organizationId: string | null;
  organizationName: string | null;
  groups: ProfileGroup[];
}

export interface UpdateProfilePayload {
  userName?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
