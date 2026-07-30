import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { CreateLoiAliasPayload, LoiAlias } from '../model/loiCheck.types';

/** Từ điển quy đổi tên tham số riêng của một dự án về tên chuẩn BXD 347 Phụ lục 02. */
export const loiAliasApi = {
  getByProject: (projectId: string) =>
    axiosInstance.get<ApiResponse<LoiAlias[]>>(`/projects/${projectId}/loi-aliases`),

  create: (projectId: string, payload: CreateLoiAliasPayload) =>
    axiosInstance.post<ApiResponse<LoiAlias>>(`/projects/${projectId}/loi-aliases`, payload),

  remove: (projectId: string, aliasId: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/projects/${projectId}/loi-aliases/${aliasId}`),
};
