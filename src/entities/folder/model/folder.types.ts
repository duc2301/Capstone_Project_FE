/* ── CDE area (ISO 19650) — numeric enum khớp BE ──────── */
export const CdeArea = {
  Wip: 0,
  Shared: 1,
  Published: 2,
  Archived: 3,
} as const;
export type CdeArea = (typeof CdeArea)[keyof typeof CdeArea];

/* Quyền hiệu lực của người dùng hiện tại trên 1 folder */
export interface EffectivePermission {
  folderId: string;
  canView: boolean;
  canEdit: boolean;
  canApprove: boolean;
}

export interface CurrentUserFolderPermissionDto {
  folderId: string;
  folderName: string;
  permission: {
    permissionId: string;
    folderId: string;
    folderName: string;
    projectParticipantId: string | null;
    canView: boolean;
    canEdit: boolean;
    canApprove: boolean;
    status: number;
  } | null;
}

/* Node thô từ GET /folder-tree/tree — BE hiện chưa trả owner/permission,
 * FE tự điền mặc định (xem toFolderTreeNode). */
export interface FolderTreeNodeDto {
  id: string;
  projectId: string;
  parentFolderId: string | null;
  name: string;
  area: CdeArea;
  hasWarning?: boolean;
  children: FolderTreeNodeDto[];
}

/* 1 file trong response GET /folder-tree/folders/{id}/contents */
export interface FolderContentsFileDto {
  id: string;
  folderId: string;
  name: string;
  fileType: number;
  status: number;
  currentVersionId: string | null;
  /* Nhãn phiên bản BE dựng sẵn, vd "P03.01", "C01" */
  displayVersion: string | null;
  uploaderEmail: string | null;
  uploadedByAccountId?: string | null;
  fileSizeBytes: number;
  /* Định dạng của bản hiện hành, vd "DWG", "RVT" (null nếu chưa có nội dung) */
  format?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  warnning?: boolean | null;
  warnningMessage?: string | null;
  /** Tóm tắt nội dung do AI sinh sau upload (null = chưa tóm tắt / không trích được chữ). */
  description?: string | null;
  hasOpenIssue?: boolean;
}

/* Query phân trang cho GET /folder-tree/folders/{id}/contents.
 * Chỉ phân trang FILES; subfolders/hoistedFiles luôn trả đủ. BE mặc định page=1,
 * pageSize=20 (tối đa 500; giá trị <1 hoặc >500 bị BE ép về 20). */
export interface FolderContentsQuery {
  page?: number;
  pageSize?: number;
}

/* Nội dung 1 folder (GET /folder-tree/folders/{id}/contents).
 * QUAN TRỌNG: chỉ `files` được phân trang — `subfolders` và `hoistedFiles` luôn trả
 * đầy đủ trên MỌI trang. Các trường phân trang (totalCount, totalPages, ...) mô tả
 * RIÊNG danh sách files, KHÔNG tính subfolders hay hoistedFiles.
 * `files` rỗng KHÔNG có nghĩa folder rỗng — có thể chỉ là trang vượt quá totalPages. */
export interface FolderContentsDto {
  id: string;
  /* Toàn bộ thư mục con xem được — KHÔNG phân trang. */
  subfolders: FolderTreeNodeDto[];
  /* Một trang tệp của folder này. */
  files: FolderContentsFileDto[];
  /* Tệp được cấp quyền riêng lẻ (chỉ với người dùng bị hạn chế) — KHÔNG phân trang. */
  hoistedFiles: FolderContentsFileDto[];
  /* = subfolders.length (tiện lợi). */
  folderCount: number;
  /* Trạng thái phân trang — chỉ áp dụng cho `files`. */
  pageNumber: number;
  pageSize: number;
  /* Tổng số FILE trong folder (cơ sở phân trang) — KHÔNG gồm hoistedFiles/subfolders. */
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/* 1 nút trong cây thư mục CDE (đã lọc theo quyền ở BE) */
export interface FolderTreeNode {
  id: string;
  projectId: string;
  parentFolderId: string | null;
  name: string;
  area: CdeArea;
  ownerOrganizationId: string | null;
  ownerGroupId: string | null;
  hasWarning: boolean;
  permission: EffectivePermission;
  children: FolderTreeNode[];
}

/* Folder phẳng (response của create/update) */
export interface Folder {
  id: string;
  projectId: string;
  parentFolderId: string | null;
  name: string;
  area: CdeArea;
  ownerOrganizationId: string | null;
  ownerGroupId: string | null;
  isTemplate: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/* ── GET /folders/{id}/group-ui — dữ liệu màn hình phân quyền thư mục ── */

/* Nhóm trong dự án chưa từng được gán quyền trên folder.
 * BE có thể không trả thông tin tổ chức -> để optional. */
export interface FolderPermissionAvailableGroup {
  projectParticipantId: string;
  groupId: string;
  groupName: string;
  organizationId?: string | null;
  organizationName?: string | null;
}

/* 1 bản ghi quyền của nhóm trên folder — hiện chỉ hỗ trợ Xem/Sửa.
 * status: 0 = đang hiệu lực, 1 = từng có quyền nhưng đã gỡ (inactive). */
export interface FolderPermissionEntry {
  id: string;
  projectParticipantId: string;
  groupParticipantName: string;
  canView: boolean;
  canEdit: boolean;
  status: number;
}

export interface FolderPermissionUiDto {
  availableGroups: FolderPermissionAvailableGroup[];
  selectedPermissions: FolderPermissionEntry[];
}

/* POST /api/folder-permissions/add-group — cập nhật phân quyền nhóm trên folder */
export interface FolderGroupPermissionInput {
  projectParticipantId: string;
  canView: boolean;
  canEdit: boolean;
}

export interface UpdateFolderGroupPermissionsPayload {
  /** folderId */
  id: string;
  /** Toàn bộ nhóm ở panel "Nhóm được chọn" kèm cờ quyền mong muốn */
  groupsPermission: FolderGroupPermissionInput[];
  /** projectParticipantId của các nhóm bị gỡ quyền (chuyển về "Nhóm hữu dụng") */
  removeParticipantIds: string[];
}

/* ── Phân quyền theo từng thành viên trên 1 thư mục (override đè lên quyền nhóm) ─────────── */

/* Mức override riêng của 1 thành viên trên tài nguyên (khớp BE, trả về dạng chuỗi).
 * None = kế thừa nhóm, View/Edit = ép quyền, Blocked = chặn hoàn toàn. */
export type UserOverrideLevel = 'None' | 'View' | 'Edit' | 'Blocked';

/* 1 dòng trong bảng phân quyền thành viên: người đang thấy thư mục qua nhóm, kèm mức override.
 * inheritedCanView/inheritedCanEdit là quyền kế thừa từ nhóm (chỉ đọc), overrideLevel là
 * mức áp dụng riêng cho thư mục này (điều khiển duy nhất được sửa trong bảng). */
export interface FolderUserPermissionMember {
  accountId: string;
  userName: string;
  email: string;
  /** Tên các nhóm mà thành viên đang qua đó thấy thư mục */
  groups: string[];
  inheritedCanView: boolean;
  inheritedCanEdit: boolean;
  overrideLevel: UserOverrideLevel;
  /** Tiện lợi: == (overrideLevel === 'Blocked') */
  isBlacklisted: boolean;
}

/* GET /folder-permissions/{folderId}/user-ui */
export interface FolderUserPermissionUiDto {
  members: FolderUserPermissionMember[];
}

/* POST /folder-permissions/add-user */
export interface FolderUserPermissionInput {
  accountId: string;
  canView: boolean;
  canEdit: boolean;
}

export interface UpdateFolderUserPermissionsPayload {
  /** folderId */
  id: string;
  /** Thành viên bật chặn (blacklist) — canView/canEdit đều false */
  usersPermission: FolderUserPermissionInput[];
  /** accountId của các thành viên tắt chặn (bỏ blacklist, trở lại kế thừa quyền nhóm) */
  removeAccountIds: string[];
}

export interface CreateSubFolderPayload {
  parentFolderId: string;
  name: string;
}

/* PUT /folders/{id} — partial (chỉ field gửi mới đè) */
export interface UpdateFolderPayload {
  name: string;
}
