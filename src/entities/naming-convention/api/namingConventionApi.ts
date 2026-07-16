import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';

import type {
  AssignFoldersPayload,
  CreateNamingConventionPayload,
  CreateNamingFieldPayload,
  CreateNamingValuePayload,
  FolderNamingConvention,
  NamingConvention,
  NamingImportPreview,
  UpdateNamingConventionPayload,
  UpdateNamingFieldPayload,
  UpdateNamingValuePayload,
} from '../model/namingConvention.types';

export const namingConventionApi = {
  /* ── Convention ────────────────────────────────────── */

  /** Danh sách convention của 1 dự án (trang cấu hình). */
  getByProject: (projectId: string) =>
    axiosInstance.get<ApiResponse<NamingConvention[]>>(`/naming-conventions/projects/${projectId}`),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<NamingConvention>>(`/naming-conventions/${id}`),

  /** Tạo convention kèm sẵn fields + values (+ locked value theo code). */
  create: (payload: CreateNamingConventionPayload) =>
    axiosInstance.post<ApiResponse<NamingConvention>>('/naming-conventions', payload),

  /** Đổi tên / delimiter / bật-tắt convention. */
  update: (id: string, payload: UpdateNamingConventionPayload) =>
    axiosInstance.put<ApiResponse<NamingConvention>>(`/naming-conventions/${id}`, payload),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<unknown>>(`/naming-conventions/${id}`),

  /** Nhân bản convention thành bản riêng cho 1 folder (leader tùy chỉnh không ảnh hưởng bản gốc). */
  cloneForFolder: (conventionId: string, folderId: string) =>
    axiosInstance.post<ApiResponse<NamingConvention>>(`/naming-conventions/${conventionId}/clone-for-folder`, { folderId }),

  /* ── Fields ────────────────────────────────────────── */

  addField: (conventionId: string, payload: CreateNamingFieldPayload) =>
    axiosInstance.post<ApiResponse<NamingConvention>>(`/naming-conventions/${conventionId}/fields`, payload),

  updateField: (fieldId: string, payload: UpdateNamingFieldPayload) =>
    axiosInstance.put<ApiResponse<NamingConvention>>(`/naming-conventions/fields/${fieldId}`, payload),

  deleteField: (fieldId: string) =>
    axiosInstance.delete<ApiResponse<unknown>>(`/naming-conventions/fields/${fieldId}`),

  /* ── Values ────────────────────────────────────────── */

  addValues: (fieldId: string, values: CreateNamingValuePayload[]) =>
    axiosInstance.post<ApiResponse<NamingConvention>>(`/naming-conventions/fields/${fieldId}/values`, values),

  updateValue: (valueId: string, payload: UpdateNamingValuePayload) =>
    axiosInstance.put<ApiResponse<NamingConvention>>(`/naming-conventions/values/${valueId}`, payload),

  deleteValue: (valueId: string) =>
    axiosInstance.delete<ApiResponse<unknown>>(`/naming-conventions/values/${valueId}`),

  /* ── Locked value ──────────────────────────────────── */

  /** Khóa field vào 1 value cố định — dialog upload sẽ ẩn dropdown của field này. */
  setLockedValue: (fieldId: string, valueId: string) =>
    axiosInstance.put<ApiResponse<NamingConvention>>(`/naming-conventions/fields/${fieldId}/locked-value`, { valueId }),

  removeLockedValue: (fieldId: string) =>
    axiosInstance.delete<ApiResponse<NamingConvention>>(`/naming-conventions/fields/${fieldId}/locked-value`),

  /* ── Gán folder ────────────────────────────────────── */

  assignFolders: (conventionId: string, payload: AssignFoldersPayload) =>
    axiosInstance.post<ApiResponse<NamingConvention>>(`/naming-conventions/${conventionId}/folders`, payload),

  unassignFolder: (folderId: string) =>
    axiosInstance.delete<ApiResponse<unknown>>(`/naming-conventions/folders/${folderId}/assignment`),

  /* ── Dialog upload ─────────────────────────────────── */

  /** Convention đang áp cho folder + fields/values để render dropdown (gọi khi mở modal upload). */
  getByFolder: (folderId: string) =>
    axiosInstance.get<ApiResponse<FolderNamingConvention>>(`/naming-conventions/folders/${folderId}`),

  /* ── Import xlsx ───────────────────────────────────── */

  /** Parse file template → preview cho admin chỉnh trước khi lưu (KHÔNG ghi DB). */
  importPreview: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return axiosInstance.post<ApiResponse<NamingImportPreview>>('/naming-conventions/import-preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    });
  },

  /** Tải file template mẫu (blob). */
  downloadTemplate: () =>
    axiosInstance.get('/naming-conventions/import-template', { responseType: 'blob', timeout: 60_000 }),
};
