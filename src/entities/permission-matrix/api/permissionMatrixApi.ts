import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  MatrixArea,
  MatrixCellResult,
  PermissionMatrixResponse,
  SavePermissionMatrixPayload,
} from '../model/permissionMatrix.types';

export const permissionMatrixApi = {
  /** Ma trận phân quyền của 1 dự án. Lọc theo khu vực nếu truyền `area`.
   *  BE trả 403 nếu người gọi không được xem/sửa ma trận. */
  getMatrix: (projectId: string, area?: MatrixArea) =>
    axiosInstance.get<ApiResponse<PermissionMatrixResponse>>(
      `/projects/${projectId}/permission-matrix`,
      { params: { area } },
    ),

  /** Lưu các ô đã thay đổi (diff). Trả về trạng thái đọc lại của từng ô. */
  saveMatrix: (projectId: string, payload: SavePermissionMatrixPayload) =>
    axiosInstance.put<ApiResponse<MatrixCellResult[]>>(
      `/projects/${projectId}/permission-matrix`,
      payload,
    ),
};
