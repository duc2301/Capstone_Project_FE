/* Tên vùng CDE — khớp chuỗi BE nhận ở transfer-zone / trả về trong zone-return-requests */
export type ZoneName = 'Wip' | 'Shared' | 'Published' | 'Archived';

/* Trạng thái yêu cầu trả tài liệu về WIP — khớp BE (chuỗi enum) */
export type ZoneReturnRequestStatus = 'Pending' | 'Approved' | 'Rejected';

/* 1 dòng trong danh sách yêu cầu trả về WIP đang chờ xử lý */
export interface ZoneReturnRequestItem {
  id: string;
  fileItemId: string;
  fileName: string;
  currentZone: ZoneName;
  requestedByAccountId?: string | null;
  requestedByName: string;
  reason: string;
  createdAt: string;
  status: ZoneReturnRequestStatus;
}

export interface TransferZonePayload {
  targetZone: ZoneName;
}

export interface CreateReturnRequestPayload {
  reason: string;
}

export interface RejectReturnRequestPayload {
  rejectReason: string;
}
