import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  AddParticipantsBulkPayload,
  AssignManagerPayload,
  BepParseResult,
  CreateProjectPayload,
  Participant,
  Project,
  UpdateParticipantStatusPayload,
  UpdateProjectPayload,
} from '../model/project.types';

export const projectApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<Project[]>>('/projects'),

  /** Dự án người dùng hiện tại tham gia (qua nhóm) hoặc làm PM — BE đã lọc sẵn. */
  getMine: () =>
    axiosInstance.get<ApiResponse<Project[]>>('/projects/mine'),

  getById: (projectId: string) =>
    axiosInstance.get<ApiResponse<Project>>(`/projects/${projectId}`),

  create: (payload: CreateProjectPayload) =>
    axiosInstance.post<ApiResponse<Project>>('/projects', payload),

  update: (projectId: string, payload: UpdateProjectPayload) =>
    axiosInstance.put<ApiResponse<Project>>(`/projects/${projectId}`, payload),

  /** POST /api/projects/{id}/image — trả presigned URL.
   *  Phải override Content-Type: default JSON làm axios serialize FormData thành JSON -> 415. */
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
};
