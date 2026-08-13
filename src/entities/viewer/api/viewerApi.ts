import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { ViewerToken } from '../model/viewer.types';

export const viewerApi = {
  getToken: () => axiosInstance.get<ApiResponse<ViewerToken>>('/viewer/token'),
};
