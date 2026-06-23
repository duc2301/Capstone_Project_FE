import type { ApiResponse } from '@/shared/api';
import { axiosInstance, getApiErrorMessage } from '@/shared/api';

import type { ApprovalDetail, ApprovalListItem, ApprovalStatus } from '../model/approval.types';

interface RawApprovalItem {
  id: string;
  fileItemId: string;
  fileItemName?: string | null;
  fileName?: string | null;
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
  createdAt: string;
  approvedAt?: string | null;
  rejectReason?: string | null;
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

function mapApprovalItem(item: RawApprovalItem): ApprovalListItem {
  return {
    id: item.id,
    fileItemId: item.fileItemId,
    fileName: item.fileItemName ?? item.fileName ?? '',
    projectId: item.projectId ?? null,
    projectName: item.projectName ?? null,
    folderId: item.folderId ?? null,
    folderName: item.folderName ?? null,
    requestedByAccountId: item.requestedBy ?? item.requestedByAccountId ?? null,
    requestedByName: item.requestedByName ?? '',
    status: normalizeApprovalStatus(item.status),
    requiresSignature: Boolean(item.requiresSignature),
    createdAt: item.createdAt,
    approvedByAccountId: item.approverId ?? item.approvedByAccountId ?? null,
    approvedByName: item.approverName ?? item.approvedByName ?? null,
    approvedAt: item.approvedAt ?? null,
    rejectReason: item.rejectReason ?? null,
  };
}

export const approvalApi = {
  submitApproval: async (fileId: string, requiresSignature: boolean): Promise<unknown> => {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(
      `/file-items/${fileId}/submit-approval`,
      { requiresSignature },
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

function formatApprovalErrorMessage(message: string): string {
  if (message.includes('requires successful VNPT SmartCA digital signature')) {
    return 'Tài liệu này cần ký số VNPT SmartCA thành công trước khi phê duyệt.';
  }

  return message;
}
