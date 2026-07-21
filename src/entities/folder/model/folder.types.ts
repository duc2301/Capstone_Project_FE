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
  canUpdate: boolean;
  canDownload: boolean;
  canVerify: boolean;
  canApprove: boolean;
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

/* Nội dung 1 folder: subfolder + file (GET /folder-tree/folders/{id}/contents) */
export interface FolderContentsDto {
  id: string;
  subfolders: FolderTreeNodeDto[];
  files: FolderContentsFileDto[];
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

/* Nhóm trong dự án chưa từng được gán quyền trên folder */
export interface FolderPermissionAvailableGroup {
  projectParticipantId: string;
  groupId: string;
  groupName: string;
  organizationId: string;
  organizationName: string;
}

/* 1 bản ghi quyền của nhóm trên folder.
 * status: 0 = đang hiệu lực, 1 = từng có quyền nhưng đã gỡ (inactive). */
export interface FolderPermissionEntry {
  id: string;
  projectParticipantId: string;
  groupParticipantName: string;
  canView: boolean;
  canEdit: boolean;
  canUpdate: boolean;
  canDownload: boolean;
  canVerify: boolean;
  canApprove: boolean;
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
  canUpdate: boolean;
  canDownload: boolean;
  canVerify: boolean;
  canApprove: boolean;
}

export interface UpdateFolderGroupPermissionsPayload {
  /** folderId */
  id: string;
  /** Toàn bộ nhóm ở panel "Nhóm được chọn" kèm cờ quyền mong muốn */
  groupsPermission: FolderGroupPermissionInput[];
  /** projectParticipantId của các nhóm bị gỡ quyền (chuyển về "Nhóm hữu dụng") */
  removeParticipantIds: string[];
}

export interface CreateSubFolderPayload {
  parentFolderId: string;
  name: string;
}

/* PUT /folders/{id} — partial (chỉ field gửi mới đè) */
export interface UpdateFolderPayload {
  name?: string;
  parentFolderId?: string;
  area?: CdeArea;
}
