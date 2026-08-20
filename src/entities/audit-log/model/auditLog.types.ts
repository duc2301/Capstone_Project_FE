/* Nhật ký hoạt động (audit log).
 * BE KHÔNG cấu hình JsonStringEnumConverter -> enum trả về dạng SỐ.
 * Thứ tự dưới đây phải khớp Domain/Enum/Audit/LogScope.cs và AuditAction.cs. */

export const LogScope = {
  System: 0,
  Project: 1,
  Group: 2,
} as const;
export type LogScope = (typeof LogScope)[keyof typeof LogScope];

/* CHỈ THÊM VÀO CUỐI — khớp AuditAction.cs (không đổi thứ tự). */
export const AuditAction = {
  Create: 0,
  Update: 1,
  Delete: 2,
  Move: 3,
  Submit: 4,
  Verify: 5,
  Approve: 6,
  Reject: 7,
  Download: 8,
  PermissionChange: 9,
  Upload: 10,
  NewVersion: 11,
  Sign: 12,
  ZoneTransfer: 13,
  ReturnRequest: 14,
  Invite: 15,
  AcceptInvite: 16,
  RejectInvite: 17,
  Assign: 18,
  StatusChange: 19,
  Archive: 20,
  View: 21,
  Share: 22,
  RevokeShare: 23,
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

/* 1 dòng nhật ký (khớp BE AuditLogResponseDTO) */
export interface AuditLogItem {
  id: string;
  scope: LogScope;
  action: AuditAction;
  actorAccountId: string | null;
  /* BE join bảng Accounts để lấy tên (entity log không snapshot tên) */
  actorName: string | null;
  projectId: string | null;
  folderId: string | null;
  groupId: string | null;
  entityType: string;
  entityId: string;
  /* Mô tả người-đọc-được, do service nghiệp vụ sinh khi ghi log */
  detail: string | null;
  createdAt: string | null;
}

/* Trang kết quả (khớp BE AuditLogPageDTO) */
export interface AuditLogPage {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

/* Query gửi lên BE (khớp AuditLogFilterDTO — ASP.NET bind không phân biệt hoa/thường) */
export interface AuditLogQuery {
  scope?: LogScope;
  action?: AuditAction;
  actorId?: string;
  search?: string;
  /* Chỉ dùng ở view Admin để lọc theo 1 dự án */
  projectId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
