import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { Account, CreateAccountPayload, UpdateAccountPayload } from '../model/account.types';

export const accountApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<Account[]>>('/accounts'),

  getById: (id: string) =>
    axiosInstance.get<ApiResponse<Account>>(`/accounts/${id}`),

  create: (payload: CreateAccountPayload) =>
    axiosInstance.post<ApiResponse<Account>>('/accounts', payload),

  update: (id: string, payload: UpdateAccountPayload) =>
    axiosInstance.put<ApiResponse<Account>>(`/accounts/${id}`, payload),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/accounts/${id}`),
};
