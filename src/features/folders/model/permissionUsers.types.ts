/* Kiểu dùng chung cho modal phân quyền thành viên (folder & file).
 * DTO của entities/folder và entities/file-item đều khớp cấu trúc này. */

/* Mức override riêng của 1 thành viên trên tài nguyên:
 * None = kế thừa nhóm, View/Edit = ép quyền, Blocked = chặn hoàn toàn. */
export type UserOverrideLevel = 'None' | 'View' | 'Edit' | 'Blocked';

/* 1 dòng trong bảng: người đang thấy tài nguyên qua nhóm, kèm mức override riêng.
 * Quyền kế thừa (inherited*) là chỉ đọc; overrideLevel là điều khiển duy nhất được sửa. */
export interface PermissionUserMember {
  accountId: string;
  userName: string;
  email: string;
  groups: string[];
  inheritedCanView: boolean;
  inheritedCanEdit: boolean;
  overrideLevel: UserOverrideLevel;
  isBlacklisted: boolean;
}

export interface PermissionUserUiData {
  members: PermissionUserMember[];
}

export interface UpdatePermissionUsersInput {
  /** folderId hoặc fileItemId */
  id: string;
  /** Thành viên bật chặn — canView/canEdit đều false */
  usersPermission: { accountId: string; canView: boolean; canEdit: boolean }[];
  /** accountId của thành viên tắt chặn (bỏ blacklist) */
  removeAccountIds: string[];
}

/** Tải bảng phân quyền thành viên của 1 tài nguyên (folder/file) */
export type PermissionUsersLoader = (resourceId: string) => Promise<PermissionUserUiData>;

/** Lưu thay đổi blacklist của 1 tài nguyên (folder/file) */
export type PermissionUsersSaver = (input: UpdatePermissionUsersInput) => Promise<void>;

export const EMPTY_PERMISSION_USER_UI: PermissionUserUiData = {
  members: [],
};
