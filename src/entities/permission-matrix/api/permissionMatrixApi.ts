import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  MatrixCellResult,
  MatrixFilter,
  PermissionMatrixResponse,
  SavePermissionMatrixPayload,
} from '../model/permissionMatrix.types';

/* Bỏ mảng rỗng để không gửi param thừa (rỗng == không lọc). */
const nonEmpty = (ids?: string[]): string[] | undefined =>
  ids && ids.length > 0 ? ids : undefined;

export const permissionMatrixApi = {
  /** Ma trận phân quyền của 1 dự án. Không truyền `filter` (hoặc rỗng) => trả
   *  toàn bộ ma trận như cũ. Mảng id được mã hoá thành param lặp lại
   *  (?groupIds=a&groupIds=b) qua `indexes: null`.
   *  BE trả 403 nếu người gọi không được xem/sửa ma trận. */
  getMatrix: (projectId: string, filter?: MatrixFilter) =>
    axiosInstance.get<ApiResponse<PermissionMatrixResponse>>(
      `/projects/${projectId}/permission-matrix`,
      {
        params: {
          area: filter?.area,
          groupIds: nonEmpty(filter?.groupIds),
          folderIds: nonEmpty(filter?.folderIds),
          fileIds: nonEmpty(filter?.fileIds),
        },
        // Lặp key thay vì groupIds[]=... để khớp binding của BE.
        paramsSerializer: { indexes: null },
      },
    ),

  /** Lưu các ô đã thay đổi (diff). Trả về trạng thái đọc lại của từng ô. */
  saveMatrix: (projectId: string, payload: SavePermissionMatrixPayload) =>
    axiosInstance.put<ApiResponse<MatrixCellResult[]>>(
      `/projects/${projectId}/permission-matrix`,
      payload,
    ),
};
