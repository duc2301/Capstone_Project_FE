/* Trạng thái phê duyệt — khớp BE (chuỗi enum) */
export type ApprovalStatus = 'PendingApproval' | 'Approved' | 'Rejected';

/* 1 dòng trong danh sách chờ duyệt / lịch sử phê duyệt */
export interface ApprovalListItem {
  id: string;
  fileItemId: string;
  fileName: string;
  currentZone?: string | null;
  targetZone?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  folderId?: string | null;
  folderName?: string | null;
  requestedByAccountId?: string | null;
  requestedByName: string;
  status: ApprovalStatus;
  requiresSignature: boolean;
  isSigned: boolean;
  signedVersionId?: string | null;
  createdAt: string;
  approvedByAccountId?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  rejectReason?: string | null;
}

/* Chi tiết 1 yêu cầu phê duyệt — cùng hình dạng với danh sách */
export type ApprovalDetail = ApprovalListItem;

export type ApprovalTargetZone = 'Shared' | 'Published' | 'Archived';

export interface SubmitApprovalPayload {
  targetZone?: ApprovalTargetZone;
  requiresSignature: boolean;
  signerAccountIds?: string[];
  signerGroupIds?: string[];
}

export interface RejectApprovalPayload {
  reason: string;
}
