import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  CdeArea,
  CreateSubFolderPayload,
  Folder,
  FolderTreeNode,
  UpdateFolderPayload,
} from '../model/folder.types';

export const folderApi = {
  /** Cây thư mục CDE của 1 dự án, đã lọc theo quyền View của người gọi.
   *  Lọc theo khu vực nếu truyền `area`. */
  getTree: (projectId: string, area?: CdeArea) =>
    axiosInstance.get<ApiResponse<FolderTreeNode[]>>('/folders/tree', {
      params: { projectId, area },
    }),

  /** Tạo thư mục con (Team Leader/PM/Admin). Area/Owner kế thừa từ folder cha ở BE. */
  createSubFolder: (payload: CreateSubFolderPayload) =>
    axiosInstance.post<ApiResponse<Folder>>('/folders', payload),

  /** Cập nhật folder: đổi tên (name) hoặc di chuyển (parentFolderId). */
  update: (id: string, payload: UpdateFolderPayload) =>
    axiosInstance.put<ApiResponse<Folder>>(`/folders/${id}`, payload),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/folders/${id}`),
};
