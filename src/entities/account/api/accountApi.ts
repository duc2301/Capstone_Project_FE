import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { Account, CreateAccountPayload, UpdateAccountPayload } from '../model/account.types';

export const accountApi = {
  getAll: () =>
    axiosInstance.get<ApiResponse<Account[]>>('/accounts'),

  create: (payload: CreateAccountPayload) =>
    axiosInstance.post<ApiResponse<Account>>('/accounts', payload),

  update: (id: string, payload: UpdateAccountPayload) =>
    axiosInstance.put<ApiResponse<Account>>(`/accounts/${id}`, payload),

  remove: (id: string) =>
    axiosInstance.delete<ApiResponse<null>>(`/accounts/${id}`),

  uploadAvatar: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return axiosInstance.post<ApiResponse<Account>>(`/accounts/${id}/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
    });
  },
};
