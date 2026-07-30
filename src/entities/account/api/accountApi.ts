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

  /** POST /api/accounts/{id}/avatar — trả presigned URL.
   *  Phải override Content-Type: default JSON làm axios serialize FormData thành JSON -> 415. */
  uploadAvatar: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return axiosInstance.post<ApiResponse<Account>>(`/accounts/${id}/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
    });
  },
};
