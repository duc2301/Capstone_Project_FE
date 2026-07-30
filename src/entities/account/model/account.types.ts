/* BE trả role/status của tài khoản dưới dạng CHUỖI tên enum (AccountResponseDTO
 * khai string), khác các enum khác của hệ thống vốn serialize ra số. */
export const ACCOUNT_ROLES = ['Admin', 'User'] as const;
export type AccountRoleName = (typeof ACCOUNT_ROLES)[number];

export const ACCOUNT_STATUSES = ['Active', 'Inactive', 'Suspended', 'PendingVerification'] as const;
export type AccountStatusName = (typeof ACCOUNT_STATUSES)[number];

/* Trạng thái Admin được ĐẶT TAY (bảng vẫn hiển thị đủ 4): Inactive trùng hệt Suspended
 * ở BE, còn PendingVerification thuộc luồng OTP do hệ thống tự đặt. */
export const ACCOUNT_ASSIGNABLE_STATUSES = ['Active', 'Suspended'] as const;

/** Dự án tài khoản đang giữ vai trò PM (Project.ManagerAccountId ở BE). */
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
  /** Doanh nghiệp/công ty trực thuộc — có thể trống. */
  organizationId: string | null;
  organizationName: string | null;
  /** URL xem ảnh đại diện (presigned, hạn 60 phút). null = chưa có ảnh -> dùng chữ cái đầu. */
  avatarUrl: string | null;
  /** Rỗng = không phải PM. PM là vai trò cấp dự án, không nằm trong role hệ thống. */
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
  /** BE cập nhật kiểu partial (null = không đổi) nên gỡ công ty phải báo bằng cờ này. */
  clearOrganization?: boolean;
}
