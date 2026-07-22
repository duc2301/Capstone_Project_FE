import type { ApiResponse } from "@/shared/api";
import { axiosInstance, getApiErrorMessage } from "@/shared/api";
import type {
  CdeArea,
  CreateSubFolderPayload,
  Folder,
  FolderContentsDto,
  FolderPermissionEntry,
  FolderPermissionUiDto,
  FolderTreeNodeDto,
  UpdateFolderGroupPermissionsPayload,
  UpdateFolderPayload,
} from "../model/folder.types";

export const folderApi = {
  /** Cây thư mục CDE của 1 dự án, đã lọc theo quyền View của người gọi.
   *  Lọc theo khu vực nếu truyền `area`. */
  getTree: (projectId: string, area?: CdeArea) =>
    axiosInstance.get<ApiResponse<FolderTreeNodeDto[]>>("/folder-tree/tree", {
      params: { projectId, area },
    }),

  /** Nội dung 1 folder (subfolder + file) — gọi khi người dùng chọn folder trên cây. */
  getContents: (folderId: string) =>
    axiosInstance.get<ApiResponse<FolderContentsDto>>(
      `/folder-tree/folders/${folderId}/contents`,
    ),

  /** Tạo thư mục con (Team Leader/PM/Admin). Area/Owner kế thừa từ folder cha ở BE. */
  createSubFolder: (payload: CreateSubFolderPayload) =>
    axiosInstance.post<ApiResponse<Folder>>("/folders", payload),

  /** Cập nhật folder: đổi tên (name) hoặc di chuyển (parentFolderId). */
  update: (id: string, payload: UpdateFolderPayload) =>
    axiosInstance.put<ApiResponse<Folder>>(`/folders/${id}`, payload),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/folders/${id}`),

  /** Dữ liệu màn hình phân quyền thư mục: nhóm khả dụng + nhóm đã gán quyền. */
  getGroupUi: (folderId: string) =>
    axiosInstance.get<ApiResponse<FolderPermissionUiDto>>(
      `/folder-permissions/${folderId}/group-ui`,
    ),

  /** Cập nhật phân quyền nhóm trên folder: gán/sửa quyền + gỡ quyền trong 1 lần gọi. */
  updateGroupPermissions: (payload: UpdateFolderGroupPermissionsPayload) =>
    axiosInstance.post<ApiResponse<FolderPermissionEntry[]>>(
      "/folder-permissions/add-group",
      payload,
    ),
};

/* Các lỗi quyền thao tác thư mục mà BE trả — dịch sang tiếng Việt rõ nghĩa thay vì để nguyên
 * tiếng Anh hoặc rơi vào thông báo lỗi chung chung "Có lỗi xảy ra". */
const FOLDER_PERMISSION_MESSAGES: Record<string, string> = {
  "Only the group's Team Leader (or project manager/Admin) can create sub-folders here.":
    "Bạn không có quyền tạo thư mục con ở đây. Chỉ Leader của nhóm phụ trách (hoặc quản lý dự án/Admin) mới được tạo.",
};

export function folderErrorMessage(err: unknown, fallback: string): string {
  const raw = getApiErrorMessage(err, "");
  if (!raw) return fallback;
  const knownKey = Object.keys(FOLDER_PERMISSION_MESSAGES).find((m) => raw.includes(m));
  return knownKey ? FOLDER_PERMISSION_MESSAGES[knownKey] : raw;
}
