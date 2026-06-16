import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  ChangeMemberRolePayload,
  ChangeMemberStatusPayload,
  CreateGroupPayload,
  Group,
} from '../model/group.types';

export const groupApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<Group[]>>('/groups'),

  create: (payload: CreateGroupPayload) =>
    axiosInstance.post<ApiResponse<Group>>('/groups', payload),

  update: (id: string, payload: Partial<CreateGroupPayload>) =>
    axiosInstance.put<ApiResponse<Group>>(`/groups/${id}`, payload),

  changeMemberRole: (groupId: string, accountId: string, payload: ChangeMemberRolePayload) =>
    axiosInstance.put<ApiResponse<Group>>(
      `/groups/${groupId}/members/${accountId}/role`,
      payload,
    ),

  changeMemberStatus: (groupId: string, accountId: string, payload: ChangeMemberStatusPayload) =>
    axiosInstance.put<ApiResponse<Group>>(
      `/groups/${groupId}/members/${accountId}/status`,
      payload,
    ),
};
