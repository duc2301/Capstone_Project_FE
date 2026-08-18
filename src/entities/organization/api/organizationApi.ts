import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  CreateOrganizationPayload,
  Organization,
  UpdateOrganizationPayload,
} from '../model/organization.types';

export interface OrganizationPage {
  items: Organization[];
  total: number;
  page: number;
  pageSize: number;
}

export const organizationApi = {
  getAll: (page = 1, pageSize = 500) =>
    axiosInstance.get<ApiResponse<OrganizationPage>>('/organizations', { params: { page, pageSize } }),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<Organization>>(`/organizations/${id}`),

  create: (payload: CreateOrganizationPayload) =>
    axiosInstance.post<ApiResponse<Organization>>('/organizations', payload),

  update: (id: string, payload: UpdateOrganizationPayload) =>
    axiosInstance.put<ApiResponse<Organization>>(`/organizations/${id}`, payload),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/organizations/${id}`),
};
