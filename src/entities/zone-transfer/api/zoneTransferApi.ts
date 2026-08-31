import type { ApiResponse } from '@/shared/api';
import { axiosInstance, getApiErrorMessage } from '@/shared/api';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

import type { ZoneName, ZoneReturnRequestItem, ZoneReturnRequestStatus } from '../model/zoneTransfer.types';

interface RawZoneReturnRequestItem {
  id?: string;
  returnRequestId?: string;
  fileItemId?: string;
  fileId?: string;
  fileItemName?: string | null;
  fileName?: string | null;
  currentZone?: number | string | null;
  fromZone?: number | string | null;
  area?: number | string | null;
  requestedByAccountId?: string | null;
  requestedBy?: string | null;
  requestedByName?: string | null;
  reason?: string | null;
  createdAt: string;
  status: number | string;
}

function unwrapResult<T>(data: ApiResponse<T>): T {
  if (!data.isSuccess) throw new Error(data.message || 'Co loi xay ra.');
  return data.result as T;
}

function normalizeZoneName(zone: number | string | null | undefined): ZoneName {
  if (zone === 1 || zone === 'Shared') return 'Shared';
  if (zone === 2 || zone === 'Published') return 'Published';
  if (zone === 3 || zone === 'Archived') return 'Archived';
  return 'Wip';
}

function normalizeReturnRequestStatus(status: number | string): ZoneReturnRequestStatus {
  if (status === 1 || status === 'Approved') return 'Approved';
  if (status === 2 || status === 'Rejected') return 'Rejected';
  return 'Pending';
}

function mapReturnRequestItem(item: RawZoneReturnRequestItem): ZoneReturnRequestItem {
  return {
    id: item.id ?? item.returnRequestId ?? '',
    fileItemId: item.fileItemId ?? item.fileId ?? '',
    fileName: item.fileItemName ?? item.fileName ?? '',
    currentZone: normalizeZoneName(item.currentZone ?? item.fromZone ?? item.area),
    requestedByAccountId: item.requestedByAccountId ?? item.requestedBy ?? null,
    requestedByName: item.requestedByName ?? item.requestedBy ?? '',
    reason: item.reason ?? '',
    createdAt: item.createdAt,
    status: normalizeReturnRequestStatus(item.status),
  };
}

export const zoneTransferApi = {
  transferZone: async (fileId: string, targetZone: ZoneName): Promise<unknown> => {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(
      `/file-items/${fileId}/transfer-zone`,
      { targetZone },
    );
    return unwrapResult(data);
  },

  createReturnRequest: async (fileId: string, reason: string, issueId?: string): Promise<unknown> => {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(
      `/file-items/${fileId}/return-requests`,
      { reason, issueId },
    );
    return unwrapResult(data);
  },

  getPendingReturnRequests: async (projectId?: string): Promise<ZoneReturnRequestItem[]> => {
    const { data } = await axiosInstance.get<ApiResponse<RawZoneReturnRequestItem[]>>(
      '/zone-return-requests/pending',
      { params: { projectId } },
    );
    return (unwrapResult(data) ?? []).map(mapReturnRequestItem);
  },

  approveReturnRequest: async (requestId: string): Promise<unknown> => {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(
      `/zone-return-requests/${requestId}/approve`,
    );
    return unwrapResult(data);
  },

  rejectReturnRequest: async (requestId: string, rejectReason: string): Promise<unknown> => {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(
      `/zone-return-requests/${requestId}/reject`,
      { rejectReason },
    );
    return unwrapResult(data);
  },
};

/* BE trả nguyên văn tiếng Anh cho các lỗi trả-về-WIP — map sang thông báo tiếng Việt thân thiện. */
const RETURN_REQUEST_MESSAGES: Record<string, TranslationKey> = {
  'Reason is required.': 'returnRequests.error.reasonRequired',
  'File in WIP cannot create return request.': 'returnRequests.error.fileInWip',
  'File is pending approval and cannot create return request.': 'returnRequests.error.pendingApproval',
  'File already has a pending return request.': 'returnRequests.error.alreadyPending',
  'Only active Team Leader can view pending return requests.': 'returnRequests.error.leaderOnly',
  'File is no longer in the requested source zone.': 'returnRequests.error.zoneChanged',
  'Reject reason is required.': 'returnRequests.error.rejectReasonRequired',
};

export function zoneTransferErrorMessage(err: unknown, fallback: string): string {
  const apiMessage = getApiErrorMessage(err, '');
  if (!apiMessage) return fallback;

  const messageKey = Object.keys(RETURN_REQUEST_MESSAGES).find((m) => apiMessage.includes(m));
  return messageKey ? t(RETURN_REQUEST_MESSAGES[messageKey]) : apiMessage;
}
