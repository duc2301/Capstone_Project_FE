/* Loại tệp — numeric enum khớp BE (Domain.Enum.File.FileType) */
export const FileType = {
  Pdf: 0,
  Ifc: 1,
  Image: 2,
  Cad: 3,
  Office: 4,
  Other: 5,
} as const;
export type FileType = (typeof FileType)[keyof typeof FileType];

/* Trạng thái phê duyệt file — khớp BE (Domain.Enum.File.FileItemStatus) */
export const FileItemStatus = {
  Draft: 0,
  PendingApproval: 1,
  Approved: 2,
  Rejected: 3,
} as const;
export type FileItemStatus = (typeof FileItemStatus)[keyof typeof FileItemStatus];

export const FileReturnRequestStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
} as const;
export type FileReturnRequestStatus = (typeof FileReturnRequestStatus)[keyof typeof FileReturnRequestStatus];

/* 1 dòng file trong danh sách folder */
export interface FileListItem {
  id: string;
  folderId: string;
  name: string;
  fileType: FileType;
  status: FileItemStatus;
  returnRequestStatus?: FileReturnRequestStatus | null;
  returnTargetZone?: string | null;
  currentVersionId: string | null;
  currentVersionNumber: number;
  sizeBytes: number;
  format: string | null;
  createdByAccountId: string | null;
  authorName: string | null;
  requiresSignature?: boolean;
  isSigned?: boolean;
  signedVersionId?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/* Cách FE hiển thị "Xem chi tiết" 1 file (khớp BE FileViewInfoDTO.Kind):
 *  - 'model'    : file thiết kế (IFC/CAD) -> mở APS ModelViewer bằng urn
 *  - 'inline'   : xem trực tiếp trên web (PDF/ảnh/text, hoặc Office đã convert sang PDF) bằng url + contentType
 *  - 'download' : không xem trực tiếp được -> chỉ tải về */
export type FileViewKind = 'model' | 'inline' | 'download';

/* Trạng thái dịch model APS — numeric enum khớp BE (Domain.Enum.File.ModelViewerStatus).
 *  Dịch chạy ở hàng đợi nền BE (đẩy sẵn lúc upload) nên reload/đóng tab không làm gián đoạn.
 *  Ready -> mở viewer ngay; Pending/Processing -> hiện "đang xử lý" + poll; Failed -> cho dịch lại;
 *  None -> file cũ, BE sẽ tự đẩy dịch khi gọi /view. */
export const ModelViewerStatus = {
  None: 0,
  Pending: 1,
  Processing: 2,
  Ready: 3,
  Failed: 4,
} as const;
export type ModelViewerStatus = (typeof ModelViewerStatus)[keyof typeof ModelViewerStatus];

export interface FileViewInfo {
  kind: FileViewKind;
  urn: string | null;
  /* Chỉ có khi kind = 'model'. null cho file không phải model. */
  viewerStatus: ModelViewerStatus | null;
  /* % tiến độ dịch (vd "75% complete") khi đang Processing. */
  viewerProgress: string | null;
  url: string | null;
  contentType: string | null;
  fileName: string;
  format: string | null;
  requiresSignature?: boolean;
  isSigned?: boolean;
  signedVersionId?: string | null;
}

/* 1 phiên bản của file */
export interface FileVersion {
  id: string;
  fileItemId: string;
  versionNumber: number;
  storagePath: string;
  fileSizeBytes: number;
  format: string;
  checksum: string | null;
  isHidden: boolean;
  uploadedByAccountId: string | null;
  uploadedByName: string | null;
  uploadedAt: string | null;
  isSigned?: boolean;
  signedAt?: string | null;
  signedBy?: string | null;
  certificateSerial?: string | null;
}
