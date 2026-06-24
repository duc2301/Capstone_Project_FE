import type { ApiResponse } from '@/shared/api';
import { axiosInstance, getApiErrorMessage } from '@/shared/api';

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

  createReturnRequest: async (fileId: string, reason: string): Promise<unknown> => {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(
      `/file-items/${fileId}/return-requests`,
      { reason },
    );
    return unwrapResult(data);
  },

  getPendingReturnRequests: async (): Promise<ZoneReturnRequestItem[]> => {
    const { data } = await axiosInstance.get<ApiResponse<RawZoneReturnRequestItem[]>>(
      '/zone-return-requests/pending',
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

export function zoneTransferErrorMessage(err: unknown, fallback: string): string {
  return getApiErrorMessage(err, fallback);
}
