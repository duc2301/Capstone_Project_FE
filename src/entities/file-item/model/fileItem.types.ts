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

/* 1 dòng file trong danh sách folder */
export interface FileListItem {
  id: string;
  folderId: string;
  name: string;
  fileType: FileType;
  status: FileItemStatus;
  currentVersionId: string | null;
  currentVersionNumber: number;
  sizeBytes: number;
  format: string | null;
  createdByAccountId: string | null;
  authorName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/* Cách FE hiển thị "Xem chi tiết" 1 file (khớp BE FileViewInfoDTO.Kind):
 *  - 'model'    : file thiết kế (IFC/CAD) -> mở APS ModelViewer bằng urn
 *  - 'inline'   : xem trực tiếp trên web (PDF/ảnh/text, hoặc Office đã convert sang PDF) bằng url + contentType
 *  - 'download' : không xem trực tiếp được -> chỉ tải về */
export type FileViewKind = 'model' | 'inline' | 'download';

export interface FileViewInfo {
  kind: FileViewKind;
  urn: string | null;
  url: string | null;
  contentType: string | null;
  fileName: string;
  format: string | null;
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
}
