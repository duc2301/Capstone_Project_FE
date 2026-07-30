/* ── Profile ──────────────────────────────────────── */
export interface ProfileGroup {
  groupId: string;
  groupName: string;
  role: string;       // Leader | Member
  joinedAt: string | null;
}

export interface Profile {
  id: string;
  userName: string;
  email: string;
  role: string | null;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  /** URL xem ảnh đại diện (presigned, hạn 60 phút). null = chưa có ảnh. */
  avatarUrl: string | null;
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
