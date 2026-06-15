import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { CreateOrganizationTypePayload, OrganizationType } from '../model/organizationType.types';

export const organizationTypeApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<OrganizationType[]>>('/organization-types'),

  create: (payload: CreateOrganizationTypePayload) =>
    axiosInstance.post<ApiResponse<OrganizationType>>('/organization-types', payload),
};
