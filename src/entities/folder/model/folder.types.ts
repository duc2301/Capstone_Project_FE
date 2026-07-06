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
  children: FolderTreeNodeDto[];
}

/* 1 file trong response GET /folder-tree/folders/{id}/contents —
 * BE chỉ trả các field cơ bản (chưa có size/format/version/author). */
export interface FolderContentsFileDto {
  id: string;
  folderId: string;
  name: string;
  fileType: number;
  status: number;
  currentVersionId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
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
