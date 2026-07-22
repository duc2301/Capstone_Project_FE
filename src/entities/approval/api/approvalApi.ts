import type { ApiResponse } from '@/shared/api';
import { axiosInstance, getApiErrorMessage } from '@/shared/api';

import type { ApprovalDetail, ApprovalListItem, ApprovalSigner, ApprovalSignerStatus, ApprovalStatus, SubmitApprovalPayload } from '../model/approval.types';

interface RawApprovalSigner {
  id: string;
  signerAccountId?: string | null;
  signerAccountName?: string | null;
  signerGroupId?: string | null;
  signerGroupName?: string | null;
  status: number | string;
  signedAt?: string | null;
  certificateSerial?: string | null;
}

interface RawApprovalItem {
  id: string;
  fileItemId: string;
  fileItemName?: string | null;
  fileName?: string | null;
  currentZone?: string | null;
  targetZone?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  folderId?: string | null;
  folderName?: string | null;
  requestedBy?: string | null;
  requestedByAccountId?: string | null;
  requestedByName?: string | null;
  approverId?: string | null;
  approverName?: string | null;
  approvedByAccountId?: string | null;
  approvedByName?: string | null;
  status: number | string;
  requiresSignature?: boolean | null;
  isSigned?: boolean | null;
  signedVersionId?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  rejectReason?: string | null;
  signers?: RawApprovalSigner[] | null;
  pendingApproverNames?: string[] | null;
  pendingApproverAccountIds?: string[] | null;
}

function unwrapResult<T>(data: ApiResponse<T>): T {
  if (!data.isSuccess) throw new Error(data.message || 'Co loi xay ra.');
  return data.result as T;
}

function normalizeApprovalStatus(status: number | string): ApprovalStatus {
  if (status === 1 || status === 'Approved') return 'Approved';
  if (status === 2 || status === 'Rejected') return 'Rejected';
  return 'PendingApproval';
}

function normalizeSignerStatus(status: number | string): ApprovalSignerStatus {
  if (status === 1 || status === 'Signed') return 'Signed';
  return 'Pending';
}

function mapApprovalSigner(item: RawApprovalSigner): ApprovalSigner {
  return {
    id: item.id,
    signerAccountId: item.signerAccountId ?? null,
    signerAccountName: item.signerAccountName ?? null,
    signerGroupId: item.signerGroupId ?? null,
    signerGroupName: item.signerGroupName ?? null,
    status: normalizeSignerStatus(item.status),
    signedAt: item.signedAt ?? null,
    certificateSerial: item.certificateSerial ?? null,
  };
}

function mapApprovalItem(item: RawApprovalItem): ApprovalListItem {
  return {
    id: item.id,
    fileItemId: item.fileItemId,
    fileName: item.fileItemName ?? item.fileName ?? '',
    currentZone: item.currentZone ?? null,
    targetZone: item.targetZone ?? null,
    projectId: item.projectId ?? null,
    projectName: item.projectName ?? null,
    folderId: item.folderId ?? null,
    folderName: item.folderName ?? null,
    requestedByAccountId: item.requestedBy ?? item.requestedByAccountId ?? null,
    requestedByName: item.requestedByName ?? '',
    status: normalizeApprovalStatus(item.status),
    requiresSignature: Boolean(item.requiresSignature),
    isSigned: Boolean(item.isSigned),
    signedVersionId: item.signedVersionId ?? null,
    createdAt: item.createdAt,
    approvedByAccountId: item.approverId ?? item.approvedByAccountId ?? null,
    approvedByName: item.approverName ?? item.approvedByName ?? null,
    approvedAt: item.approvedAt ?? null,
    rejectReason: item.rejectReason ?? null,
    signers: (item.signers ?? []).map(mapApprovalSigner),
    pendingApproverNames: item.pendingApproverNames ?? [],
    pendingApproverAccountIds: item.pendingApproverAccountIds ?? [],
  };
}

export const approvalApi = {
  submitApproval: async (fileId: string, payload: SubmitApprovalPayload): Promise<unknown> => {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(
      `/file-items/${fileId}/submit-approval`,
      {
        targetZone: payload.targetZone ?? null,
        requiresSignature: payload.requiresSignature,
        signerAccountIds: payload.signerAccountIds ?? [],
        signerGroupIds: payload.signerGroupIds ?? [],
      },
    );
    return unwrapResult(data);
  },

  getPendingApprovals: async (): Promise<ApprovalListItem[]> => {
    const { data } = await axiosInstance.get<ApiResponse<RawApprovalItem[]>>('/approvals/pending');
    return (unwrapResult(data) ?? []).map(mapApprovalItem);
  },

  getApprovalDetail: async (approvalId: string): Promise<ApprovalDetail> => {
    const { data } = await axiosInstance.get<ApiResponse<RawApprovalItem>>(`/approvals/${approvalId}`);
    return mapApprovalItem(unwrapResult(data));
  },

  getApprovals: async (): Promise<ApprovalListItem[]> => {
    const { data } = await axiosInstance.get<ApiResponse<RawApprovalItem[]>>('/approvals');
    return (unwrapResult(data) ?? []).map(mapApprovalItem);
  },

  approveApproval: async (approvalId: string): Promise<unknown> => {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(`/approvals/${approvalId}/approve`);
    return unwrapResult(data);
  },

  rejectApproval: async (approvalId: string, reason: string): Promise<unknown> => {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(`/approvals/${approvalId}/reject`, { reason });
    return unwrapResult(data);
  },
};

export function approvalErrorMessage(err: unknown, fallback: string): string {
  const apiMessage = getApiErrorMessage(err, '');
  if (apiMessage) return formatApprovalErrorMessage(apiMessage);
  if (err instanceof Error && err.message) return formatApprovalErrorMessage(err.message);
  return fallback;
}

/* Các lỗi BE trả khi người dùng/người ký chưa thuộc nhóm phụ trách, chưa phải Leader, hoặc folder
 * chưa được cấu hình quyền Duyệt (CanApprove) cho nhóm nào cả — mỗi lỗi có hướng khắc phục khác
 * nhau (thêm vào nhóm / đổi vai trò Leader ở tab "Nhóm", hay vào "Phân quyền" cấu hình CanApprove). */
const TEAM_PERMISSION_MESSAGES: Record<string, string> = {
  'Only members of the file team can submit approval.':
    'Bạn chưa thuộc nhóm phụ trách thư mục này nên không thể gửi yêu cầu phê duyệt. Hãy nhờ quản trị dự án thêm bạn vào nhóm ở tab "Nhóm".',
  'Current user is not required to sign this approval request.':
    'Bạn chưa được chỉ định là người ký cho yêu cầu phê duyệt này. Hãy nhờ người gửi yêu cầu chọn lại người ký, hoặc thêm bạn vào nhóm ký ở tab "Nhóm".',
  'No group has been granted approve permission on this folder yet. Please ask the project Admin to configure it.':
    'Thư mục này chưa được cấp quyền Duyệt (CanApprove) cho nhóm nào cả. Hãy nhờ quản trị dự án vào "Phân quyền" cấu hình quyền Duyệt cho đúng nhóm phụ trách.',
  'Only the Team Leader can approve or reject this file.':
    'Chỉ Leader của nhóm phụ trách mới được phê duyệt/từ chối tài liệu này. Hãy nhờ quản trị dự án đổi vai trò Leader ở tab "Nhóm".',
  'Only the Team Leader can perform this action.':
    'Bạn chưa được phân quyền để thực hiện thao tác này trên tài liệu này.',
  'Signer must be an active Team Leader of a group in this project.':
    'Người ký được chọn phải là Leader active của 1 nhóm trong dự án. Vui lòng chọn lại người ký hoặc nhờ quản trị dự án đổi vai trò Leader ở tab "Nhóm".',
};

/* Phát hiện các lỗi "thiếu quyền theo nhóm/vai trò" ở trên để FE hiện cảnh báo rõ ràng
 * + nút đưa người dùng sang tab "Nhóm" thay vì chỉ hiện toast lỗi chung chung. */
export function isTeamPermissionError(err: unknown): boolean {
  const raw = getApiErrorMessage(err, '') || (err instanceof Error ? err.message : '');
  return Object.keys(TEAM_PERMISSION_MESSAGES).some((m) => raw.includes(m));
}

function formatApprovalErrorMessage(message: string): string {
  const teamMessageKey = Object.keys(TEAM_PERMISSION_MESSAGES).find((m) => message.includes(m));
  if (teamMessageKey) return TEAM_PERMISSION_MESSAGES[teamMessageKey];

  if (message.includes('requires successful VNPT SmartCA digital signature')) {
    return 'Tài liệu này cần ký số VNPT SmartCA thành công trước khi phê duyệt.';
  }

  if (message.includes('Signed PDF must be generated before approval')) {
    return 'Tài liệu cần tạo PDF đã ký trước khi phê duyệt.';
  }

  return message;
}
