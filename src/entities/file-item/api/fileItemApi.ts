import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { DeleteFileResult, FileListItem, FilePermissionEntry, FilePermissionUiDto, FileUploadResult, FileVersion, FileVersionResult, FileViewInfo, LinkableFile, RelatedFilesResult, UpdateFileGroupPermissionsPayload } from '../model/fileItem.types';

export const fileItemApi = {
  /** Bắn file lên server */
  upload: (formData: FormData, onProgress?: (pct: number) => void) =>
    axiosInstance.post<ApiResponse<FileUploadResult>>('/file-items/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0, // Kệ nó cho upload tẹt ga, không set timeout vì file nặng lắm
      onUploadProgress: onProgress
        ? (e) => onProgress(Math.round((e.loaded / (e.total || e.loaded || 1)) * 100))
        : undefined,
    }),

  /** Danh sách file trong 1 folder. */
  getByFolder: (folderId: string) =>
    axiosInstance.get<ApiResponse<FileListItem[]>>(`/file-items/by-folder/${folderId}`),

  /** Lịch sử phiên bản của 1 file (mới nhất trước). */
  getVersions: (fileItemId: string) =>
    axiosInstance.get<ApiResponse<FileVersion[]>>(`/file-versions/${fileItemId}/history`),

  /** Khôi phục 1 phiên bản cũ làm phiên bản hiện hành (tạo bản mới với nội dung của bản cũ). */
  restoreVersion: (fileItemId: string, versionStateId: string) =>
    axiosInstance.post<ApiResponse<FileVersionResult>>(
      `/file-versions/${fileItemId}/restore/${versionStateId}`,
    ),

  getVersionView: (fileItemId: string, versionStateId: string) =>
    axiosInstance.get<ApiResponse<FileViewInfo>>(
      `/file-versions/${fileItemId}/${versionStateId}/view`,
    ),

  downloadVersion: (fileItemId: string, versionStateId: string) =>
    axiosInstance.get(`/file-versions/${fileItemId}/${versionStateId}/download`, {
      responseType: 'blob',
      timeout: 60_000,
    }),

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

  deleteFlagged: (fileItemId: string) =>
    axiosInstance.delete<ApiResponse<DeleteFileResult>>(`/file-items/${fileItemId}/flagged`),

  /** Niêm phong lưu trữ: PM/Admin chốt bản Published chính thức của file vào vùng Archived. */
  archive: (fileItemId: string) =>
    axiosInstance.post<ApiResponse<{ archivedFileItemId: string }>>(`/file-items/${fileItemId}/archive`),

  getRelatedFiles: (fileItemId: string) =>
    axiosInstance.get<ApiResponse<RelatedFilesResult>>(`/file-items/${fileItemId}/related-files`),

  addRelatedFiles: (fileItemId: string, relatedFileItemIds: string[]) =>
    axiosInstance.post<ApiResponse<RelatedFilesResult>>(`/file-items/${fileItemId}/related-files`, {
      relatedFileItemIds,
    }),

  removeRelatedFile: (fileItemId: string, linkedFileItemId: string) =>
    axiosInstance.delete<ApiResponse<unknown>>(
      `/file-items/${fileItemId}/related-files/${linkedFileItemId}`,
    ),

  getLinkableFiles: (folderId: string, excludeFileItemId?: string) =>
    axiosInstance.get<ApiResponse<LinkableFile[]>>('/file-items/linkable', {
      params: { folderId, excludeFileItemId },
    }),

  /** Dữ liệu màn hình phân quyền file: nhóm khả dụng + nhóm đã gán quyền. */
  getPermissionGroupUi: (fileItemId: string) =>
    axiosInstance.get<ApiResponse<FilePermissionUiDto>>(
      `/file-permissions/${fileItemId}/group-ui`,
    ),

  /** Cập nhật phân quyền nhóm trên file: gán/sửa quyền + gỡ quyền trong 1 lần gọi. */
  updateGroupPermissions: (payload: UpdateFileGroupPermissionsPayload) =>
    axiosInstance.post<ApiResponse<FilePermissionEntry[]>>('/file-permissions/add-group', payload),
};
