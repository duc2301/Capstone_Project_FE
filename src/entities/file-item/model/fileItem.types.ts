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
  /* Nhãn phiên bản BE dựng sẵn (vd "P03.01") — null với endpoint cũ chưa trả */
  displayVersion?: string | null;
  sizeBytes: number;
  format: string | null;
  createdByAccountId: string | null;
  authorName: string | null;
  requiresSignature?: boolean;
  isSigned?: boolean;
  signedVersionId?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  warnning?: boolean | null;
  warnningMessage?: string | null;
  /** Tóm tắt nội dung do AI sinh sau khi upload (null = chưa tóm tắt / không trích được chữ). */
  description?: string | null;
  hasOpenIssue?: boolean;
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

/* ── Tệp liên quan (file links) ────────────────────────────
 * Liên kết HAI CHIỀU giữa 2 file: mở file nào trong cặp cũng thấy file kia.
 * BE lọc sẵn theo quyền View của người gọi — FE chỉ hiển thị những gì BE trả về,
 * KHÔNG tự suy quyền (xem 06-fe-be-contract.md §5). */

/* Khu vực CDE của tệp liên quan — numeric union khớp BE (Domain.Enum.Cde.CdeArea).
 * Khai lại ở đây thay vì dùng lại `CdeArea` của entities/folder vì FSD cấm entities
 * import chéo entities; giá trị phải khớp đúng entities/folder/model/folder.types.ts. */
export const RelatedFileArea = {
  Wip: 0,
  Shared: 1,
  Published: 2,
  Archived: 3,
} as const;
export type RelatedFileArea = (typeof RelatedFileArea)[keyof typeof RelatedFileArea];

/* 1 dòng trong danh sách "Tệp liên quan" khi xem 1 file */
export interface RelatedFile {
  id: string;
  name: string;
  fileType: FileType;
  status: FileItemStatus;
  folderId: string;
  folderName: string;
  area: RelatedFileArea;
  currentVersionNumber: number;
  /* Chuỗi version theo hệ mới, vd "P01.02" / "C01" (null nếu file chưa có version state). */
  displayVersion: string | null;
  format: string | null;
  sizeBytes: number;
  /* Thông tin của chính liên kết, không phải của file */
  linkedAt: string;
  linkedByName: string | null;
}

/* Response của GET/POST /file-items/{id}/related-files.
 * canLink nằm ở cấp danh sách vì nó là quyền trên FILE ĐANG XEM (Edit/Update trên folder chứa nó),
 * dùng chung cho mọi liên kết — và FE cần nó CẢ KHI files rỗng để ẩn nút "Thêm liên kết". */
export interface RelatedFilesResult {
  canLink: boolean;
  files: RelatedFile[];
}

/* 1 dòng trong picker chọn tệp để liên kết (chỉ file trong thư mục của nhóm ở cùng khu vực) */
export interface LinkableFile {
  id: string;
  name: string;
  fileType: FileType;
  folderId: string;
  folderName: string;
  currentVersionNumber: number;
  /* Chuỗi version theo hệ mới, vd "P01.02" / "C01" (null nếu file chưa có version state). */
  displayVersion: string | null;
  format: string | null;
  sizeBytes: number;
  updatedAt: string | null;
  /* Đã liên kết sẵn với file nguồn -> picker tick sẵn + khoá */
  alreadyLinked: boolean;
}

/* 1 phiên bản của file — khớp BE /file-versions/{fileItemId}/history */
export interface FileVersion {
  id: string;
  fileItemId: string;
  isCurrent: boolean;
  /* 0 = Work In Progress (P..), 1 = Shared/Published (C..) — khớp BE Domain.Enum.File.VersionStage */
  stage: number;
  workingRevision: number;
  workingVersion: number;
  publishedRevision: number;
  /* Nhãn hiển thị BE đã dựng sẵn, vd "P03.01", "C01" */
  displayVersion: string;
  fileName: string;
  storagePath: string;
  fileSizeBytes: number;
  format: string;
  checksum: string | null;
  createdAt: string | null;
}
