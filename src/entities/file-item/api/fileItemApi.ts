import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { FileListItem, FileVersion, FileViewInfo } from '../model/fileItem.types';

export const fileItemApi = {
  /** Bắn file lên server */
  upload: (formData: FormData, onProgress?: (pct: number) => void) =>
    axiosInstance.post<ApiResponse<unknown>>('/file-items/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0, // Kệ nó cho upload tẹt ga, không set timeout vì file nặng lắm
      onUploadProgress: onProgress
        ? (e) => onProgress(Math.round((e.loaded / (e.total || e.loaded || 1)) * 100))
        : undefined,
    }),

  /** Danh sách file trong 1 folder. */
  getByFolder: (folderId: string) =>
    axiosInstance.get<ApiResponse<FileListItem[]>>(`/file-items/by-folder/${folderId}`),

  /** Tất cả phiên bản của 1 file (mới nhất trước). */
  getVersions: (fileItemId: string) =>
    axiosInstance.get<ApiResponse<FileVersion[]>>(`/file-items/${fileItemId}/versions`),

  /** Tải nội dung file về (blob, qua server – có kèm token). */
  download: (fileItemId: string) =>
    axiosInstance.get(`/file-items/${fileItemId}/download`, { responseType: 'blob', timeout: 60_000 }),

  /** Lấy cục PDF về để vẽ 2D lên */
  getViewPdf: (fileItemId: string) =>
    axiosInstance.get<ArrayBuffer>(`/file-items/${fileItemId}/view-pdf`, {
      responseType: 'arraybuffer',
      timeout: 60_000,
    }),

  /** Hỏi xem file này mở kiểu gì (ảnh, 3D hay tải về) */
  getView: (fileItemId: string) =>
    axiosInstance.get<ApiResponse<FileViewInfo>>(`/file-items/${fileItemId}/view`),

  /** Kêu server dịch lại cái file 3D */
  retranslate: (fileItemId: string) =>
    axiosInstance.post<ApiResponse<unknown>>(`/file-items/${fileItemId}/retranslate`),

  /** Xóa file */
  delete: (fileItemId: string) => axiosInstance.delete<ApiResponse<unknown>>(`/file-items/${fileItemId}`),
};
