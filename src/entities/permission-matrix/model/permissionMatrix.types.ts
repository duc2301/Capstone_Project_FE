/* ── Ma trận phân quyền (RACI) — kiểu dữ liệu khớp BE ────────────────
 * Toàn bộ enum serialize dưới dạng SỐ. CdeArea khai lại tại đây thay vì
 * import từ entity folder — theo ranh giới FSD, entity chỉ được phụ thuộc
 * layer shared, không phụ thuộc entity khác. */

/* Mức quyền trên 1 ô. Write bao hàm Read. Inherit chỉ áp dụng cho file. */
export const PermissionLevel = {
  Inherit: 0, // Không có luật riêng -> kế thừa từ thư mục (chỉ file)
  NoAccess: 1, // N
  Read: 2, // R
  Write: 3, // W (bao hàm R)
} as const;
export type PermissionLevel = (typeof PermissionLevel)[keyof typeof PermissionLevel];

/* Loại đối tượng của 1 hàng trong ma trận. */
export const MatrixTargetType = {
  Folder: 0,
  File: 1,
} as const;
export type MatrixTargetType = (typeof MatrixTargetType)[keyof typeof MatrixTargetType];

/* Khu vực CDE (ISO 19650) — dùng cho bộ lọc theo khu vực. */
export const MatrixArea = {
  Wip: 0,
  Shared: 1,
  Published: 2,
  Archived: 3,
} as const;
export type MatrixArea = (typeof MatrixArea)[keyof typeof MatrixArea];

/* 1 cột = 1 nhóm tham gia dự án. */
export interface MatrixColumn {
  projectParticipantId: string;
  groupId: string;
  groupName: string;
}

/* 1 ô = giao của 1 hàng (folder/file) và 1 cột (nhóm). */
export interface MatrixCell {
  projectParticipantId: string; // khớp 1 cột
  level: PermissionLevel; // mức đang hiệu lực (đã tính kế thừa với file)
  isInherited: boolean; // true = file đang kế thừa từ thư mục cha
  editable: boolean; // false = render nhưng disable
}

/* 1 hàng = 1 folder hoặc 1 file trong cây dự án. */
export interface MatrixRow {
  targetId: string;
  targetType: MatrixTargetType;
  parentRowId: string | null; // cha hiển thị (dựng cây); null = cấp cao nhất
  name: string;
  area: MatrixArea;
  isRootArea: boolean; // true => header cấu trúc, không có ô để gán
  assignable: boolean; // false cho root area
  cells: MatrixCell[]; // 1 phần tử / cột (cùng tập projectParticipantId)
}

/* Phạm vi quyền của người đang thao tác. */
export interface MatrixActor {
  isFullAccess: boolean; // admin/PM/project-admin => sửa cả cây
  editableFolderIds: string[]; // leader: id folder được sửa; rỗng khi isFullAccess
}

/* GET /api/projects/{projectId}/permission-matrix */
export interface PermissionMatrixResponse {
  projectId: string;
  columns: MatrixColumn[];
  rows: MatrixRow[];
  actor: MatrixActor;
}

/* 1 thay đổi gửi lên khi lưu. */
export interface MatrixCellChange {
  targetId: string;
  targetType: MatrixTargetType;
  projectParticipantId: string;
  level: PermissionLevel; // N/R/W cho folder; N/R/W/Inherit cho file
}

/* PUT /api/projects/{projectId}/permission-matrix — chỉ gửi ô đã đổi. */
export interface SavePermissionMatrixPayload {
  changes: MatrixCellChange[];
}

/* Trạng thái đọc lại của 1 ô sau khi lưu — dùng để hoà lại state cục bộ. */
export interface MatrixCellResult {
  targetId: string;
  targetType: MatrixTargetType;
  projectParticipantId: string;
  level: PermissionLevel;
  isInherited: boolean;
}
