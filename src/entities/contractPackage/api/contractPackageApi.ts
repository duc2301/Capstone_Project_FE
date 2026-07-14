import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';

export interface ContractPackage {
  id: string;
  projectId: string;
  code: string;
  name: string;
  description?: string;
  contractValue?: number;
  startDate?: string;
  endDate?: string;
  status: number;
  isDefault: boolean;
  createdAt?: string;
  workTypes?: string;
  scopeDescription?: string;
  taxRate?: number;
  currency?: string;
  notes?: string;
  documentFolderId?: string;
  assignments?: Array<{
    id: string;
    organizationId: string;
    organizationName?: string;
    organizationCode?: string;
    role: number;
    contractNumber?: string;
    representativeAccountId?: string;
    representativeName?: string;
    representativeEmail?: string;
    representativePhone?: string;
    position?: string;
    vatCode?: string;
    contractSignDate?: string;
    createdAt?: string;
  }>;
}

export interface CreateContractPackagePayload {
  projectId: string;
  code?: string;
  name: string;
  description?: string;
  contractValue?: number;
  startDate?: string;
  endDate?: string;
  status: number;
  isDefault: boolean;
  workTypes?: string;
  scopeDescription?: string;
  taxRate?: number;
  currency?: string;
  notes?: string;
  documentFolderId?: string;

  contractorOrganizationId?: string;
  representativeAccountId?: string;
  contractNumber?: string;
  contractSignDate?: string;
  contractJobTitle?: string;
}

export interface UpdateContractPackagePayload extends Partial<CreateContractPackagePayload> {}

export const contractPackageApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<ContractPackage[]>>('/contract-packages'),

  getByProjectId: (projectId: string) =>
    axiosInstance.get<ApiResponse<ContractPackage[]>>(`/contract-packages/project/${projectId}`),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<ContractPackage>>(`/contract-packages/${id}`),

  create: (payload: CreateContractPackagePayload) =>
    axiosInstance.post<ApiResponse<ContractPackage>>('/contract-packages', payload),

  update: (id: string, payload: UpdateContractPackagePayload) =>
    axiosInstance.put<ApiResponse<ContractPackage>>(`/contract-packages/${id}`, payload),

  delete: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/contract-packages/${id}`),

  createWipFolder: (projectId: string, contractorName: string) =>
    axiosInstance.post<ApiResponse<any>>('/contract-packages/create-wip-folder', { projectId, contractorName }),
};
