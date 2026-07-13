import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { LoiCheckResult } from '../model/loiCheck.types';

export const loiCheckApi = {
  get: (fileItemId: string) =>
    axiosInstance.get<ApiResponse<LoiCheckResult | null>>(`/file-items/${fileItemId}/loi-check`),

  recompute: (fileItemId: string) =>
    axiosInstance.post<ApiResponse<LoiCheckResult>>(`/file-items/${fileItemId}/loi-check/recompute`),
};
