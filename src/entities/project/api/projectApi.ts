import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  AddParticipantsBulkPayload,
  AssignManagerPayload,
  CreateProjectPayload,
  Participant,
  Project,
  UpdateParticipantStatusPayload,
} from '../model/project.types';

export const projectApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<Project[]>>('/projects'),

  getById: (projectId: string) =>
    axiosInstance.get<ApiResponse<Project>>(`/projects/${projectId}`),

  create: (payload: CreateProjectPayload) =>
    axiosInstance.post<ApiResponse<Project>>('/projects', payload),

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
};
