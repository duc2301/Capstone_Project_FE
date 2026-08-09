import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  Account,
  AccountImportResult,
  CreateAccountPayload,
  UpdateAccountPayload,
} from '../model/account.types';

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

  /** Tải file Excel mẫu để nhập tài khoản hàng loạt (blob). */
  downloadImportTemplate: () =>
    axiosInstance.get('/accounts/import-template', { responseType: 'blob', timeout: 60_000 }),

  /** Nhập tài khoản hàng loạt từ file .xlsx đã điền theo template. */
  importAccounts: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return axiosInstance.post<ApiResponse<AccountImportResult>>('/accounts/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
    });
  },
};
