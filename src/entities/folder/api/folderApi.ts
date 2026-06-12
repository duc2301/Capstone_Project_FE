import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { CdeArea, FolderTreeNode } from '../model/folder.types';

export const folderApi = {
  /** Cây thư mục CDE của 1 dự án, đã lọc theo quyền View của người gọi.
   *  Lọc theo khu vực nếu truyền `area`. */
  getTree: (projectId: string, area?: CdeArea) =>
    axiosInstance.get<ApiResponse<FolderTreeNode[]>>('/folders/tree', {
      params: { projectId, area },
    }),
};
