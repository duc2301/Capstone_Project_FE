import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { CreateOrganizationPayload, Organization, UpdateOrganizationPayload } from '../model/organization.types';

export const organizationApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<Organization[]>>('/organizations'),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<Organization>>(`/organizations/${id}`),

  create: (payload: CreateOrganizationPayload) =>
    axiosInstance.post<ApiResponse<Organization>>('/organizations', payload),

  update: (id: string, payload: UpdateOrganizationPayload) =>
    axiosInstance.put<ApiResponse<Organization>>(`/organizations/${id}`, payload),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/organizations/${id}`),
};
