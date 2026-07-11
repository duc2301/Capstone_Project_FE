import type { ApiResponse } from "@/shared/api";
import { axiosInstance } from "@/shared/api";
import type {
  CdeArea,
  CreateSubFolderPayload,
  Folder,
  FolderContentsDto,
  FolderPermissionUiDto,
  FolderTreeNodeDto,
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
};
