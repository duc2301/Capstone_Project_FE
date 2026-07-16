/* Trạng thái phê duyệt — khớp BE (chuỗi enum) */
export type ApprovalStatus = 'PendingApproval' | 'Approved' | 'Rejected';

/* Trạng thái ký của 1 signer bắt buộc trong approval cần nhiều người ký */
export type ApprovalSignerStatus = 'Pending' | 'Signed';

export interface ApprovalSigner {
  id: string;
  signerAccountId?: string | null;
  signerAccountName?: string | null;
  signerGroupId?: string | null;
  signerGroupName?: string | null;
  status: ApprovalSignerStatus;
  signedAt?: string | null;
  certificateSerial?: string | null;
}

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
  signers: ApprovalSigner[];
}

/* Chi tiết 1 yêu cầu phê duyệt — cùng hình dạng với danh sách */
export type ApprovalDetail = ApprovalListItem;

export type ApprovalTargetZone = 'Shared' | 'Published' | 'Archived';

export interface SubmitApprovalPayload {
  targetZone?: ApprovalTargetZone | null;
  requiresSignature: boolean;
  signerAccountIds?: string[];
  signerGroupIds?: string[];
}

export interface RejectApprovalPayload {
  reason: string;
}
