import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { CreateOrganizationTypePayload, OrganizationType, UpdateOrganizationTypePayload } from '../model/organizationType.types';

export const organizationTypeApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<OrganizationType[]>>('/organization-types'),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<OrganizationType>>(`/organization-types/${id}`),

  create: (payload: CreateOrganizationTypePayload) =>
    axiosInstance.post<ApiResponse<OrganizationType>>('/organization-types', payload),

  update: (id: string, payload: UpdateOrganizationTypePayload) =>
    axiosInstance.put<ApiResponse<OrganizationType>>(`/organization-types/${id}`, payload),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/organization-types/${id}`),
};
