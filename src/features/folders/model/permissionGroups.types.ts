/* Kiểu dùng chung cho modal phân quyền nhóm (folder & file).
 * DTO của entities/folder và entities/file-item đều khớp cấu trúc này. */

export interface PermissionGroupItem {
  projectParticipantId: string;
  groupName: string;
  organizationName?: string | null;
}

export interface PermissionGroupEntry {
  id: string;
  projectParticipantId: string;
  groupParticipantName: string;
  canView: boolean;
  canEdit: boolean;
  /** 0 = đang hiệu lực, 1 = từng có quyền nhưng đã gỡ */
  status: number;
}

export interface PermissionGroupUiData {
  availableGroups: PermissionGroupItem[];
  selectedPermissions: PermissionGroupEntry[];
}

export interface UpdatePermissionGroupsInput {
  /** folderId hoặc fileItemId */
  id: string;
  groupsPermission: { projectParticipantId: string; canView: boolean; canEdit: boolean }[];
  removeParticipantIds: string[];
}

/** Tải dữ liệu phân quyền của 1 tài nguyên (folder/file) */
export type PermissionGroupsLoader = (resourceId: string) => Promise<PermissionGroupUiData>;

/** Lưu thay đổi phân quyền của 1 tài nguyên (folder/file) */
export type PermissionGroupsSaver = (input: UpdatePermissionGroupsInput) => Promise<void>;

export const EMPTY_PERMISSION_GROUP_UI: PermissionGroupUiData = {
  availableGroups: [],
  selectedPermissions: [],
};
