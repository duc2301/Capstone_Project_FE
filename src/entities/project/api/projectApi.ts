import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  AddParticipantsBulkPayload,
  AssignManagerPayload,
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
};
