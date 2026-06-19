import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { FileListItem, FileVersion, FileViewInfo } from '../model/fileItem.types';

export const fileItemApi = {
  /** Tải tệp lên 1 thư mục (multipart). FormData gồm: file, FolderId, FileType, Name?.
   *  onProgress: % hoàn tất (0-100) cho thanh tiến độ. */
  upload: (formData: FormData, onProgress?: (pct: number) => void) =>
    axiosInstance.post<ApiResponse<unknown>>('/file-items/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0, // file lớn (CAD/BIM tới 500MB) — không đặt timeout, dựa vào tiến độ upload
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

  /** "Xem chi tiết": BE trả cách hiển thị (model/inline/download).
   *  Lần đầu với model lớn (.nwd/.rvt) BE phải đẩy file lên APS + convert Office -> có thể mất vài phút.
   *  Không đặt timeout ở FE; để BE (HttpClient APS timeout 10 phút) quyết định. */
  getView: (fileItemId: string) =>
    axiosInstance.get<ApiResponse<FileViewInfo>>(`/file-items/${fileItemId}/view`, { timeout: 0 }),
};
