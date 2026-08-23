import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  AddParticipantsBulkPayload,
  AssignManagerPayload,
  BepParseResult,
  CreateProjectPayload,
  Participant,
  Project,
  ProjectListQuery,
  ProjectPage,
  UpdateParticipantStatusPayload,
  UpdateProjectPayload,
} from '../model/project.types';

/** Bỏ hẳn các tham số rỗng/không set — BE yêu cầu omit param rỗng, không gửi chuỗi trống. */
function toProjectParams(query: ProjectListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (query.page != null) params.page = query.page;
  if (query.pageSize != null) params.pageSize = query.pageSize;
  if (query.search?.trim()) params.search = query.search.trim();
  if (query.status) params.status = query.status;
  if (query.ownerOrganizationId) params.ownerOrganizationId = query.ownerOrganizationId;
  return params;
}

export const projectApi = {
  /** Danh sách dự án đã PHÂN TRANG + LỌC phía server. Đọc list từ `result.items`. */
  getAll: (query: ProjectListQuery = {}) =>
    axiosInstance.get<ApiResponse<ProjectPage>>('/projects', { params: toProjectParams(query) }),

  /** Dự án người dùng hiện tại tham gia (qua nhóm) hoặc làm PM — BE lọc theo quyền
   *  TRƯỚC, rồi mới áp bộ lọc. Đã PHÂN TRANG + LỌC phía server (cùng contract với
   *  getAll). Đọc list từ `result.items`. */
  getMine: (query: ProjectListQuery = {}) =>
    axiosInstance.get<ApiResponse<ProjectPage>>('/projects/mine', { params: toProjectParams(query) }),

  getById: (projectId: string) =>
    axiosInstance.get<ApiResponse<Project>>(`/projects/${projectId}`),

  getByOrganization: (organizationId: string) =>
    axiosInstance.get<ApiResponse<Project[]>>(`/organizations/${organizationId}/projects`),

  create: (payload: CreateProjectPayload) =>
    axiosInstance.post<ApiResponse<Project>>('/projects', payload),

  update: (projectId: string, payload: UpdateProjectPayload) =>
    axiosInstance.put<ApiResponse<Project>>(`/projects/${projectId}`, payload),

  uploadImage: (projectId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return axiosInstance.post<ApiResponse<Project>>(`/projects/${projectId}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
    });
  },

  assignManager: (projectId: string, payload: AssignManagerPayload) =>
    axiosInstance.post<ApiResponse<Project>>(`/projects/${projectId}/manager`, payload),

  addParticipantsBulk: (projectId: string, payload: AddParticipantsBulkPayload) =>
    axiosInstance.post<ApiResponse<Participant[]>>(
      `/projects/${projectId}/participants/bulk`,
      payload,
    ),

  getParticipants: (projectId: string) =>
    axiosInstance.get<ApiResponse<Participant[]>>(`/projects/${projectId}/participants`),

  updateParticipantStatus: (
    projectId: string,
    groupId: string,
    payload: UpdateParticipantStatusPayload,
  ) =>
    axiosInstance.put<ApiResponse<Participant>>(
      `/projects/${projectId}/participants/${groupId}/status`,
      payload,
    ),

  delete: (projectId: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/projects/${projectId}`),

  // Khởi tạo nhanh: tải file BEP (multipart) -> AI trả field prefill cho stepper.
  // Phải override Content-Type multipart (axiosInstance mặc định application/json),
  // và timeout: 0 vì AI/Ollama generate có thể lâu hơn timeout mặc định 10s.
  parseBep: (formData: FormData) =>
    axiosInstance.post<ApiResponse<BepParseResult>>('/projects/parse-bep', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
    }),

  downloadFileBundle: (projectId: string) =>
    axiosInstance.get(`/projects/${projectId}/files/bundle`, {
      responseType: 'blob',
      timeout: 0,
    }),
};
