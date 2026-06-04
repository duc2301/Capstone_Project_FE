import type { AxiosProgressEvent } from 'axios';

import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  TranslationStatusResult,
  UploadModelResult,
  ViewerToken,
} from '../model/viewer.types';

export const viewerApi = {
  getToken: () => axiosInstance.get<ApiResponse<ViewerToken>>('/viewer/token'),

  uploadModel: (file: File, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    return axiosInstance.post<ApiResponse<UploadModelResult>>(
      '/viewer/models',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        onUploadProgress: (event: AxiosProgressEvent) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      },
    );
  },

  getStatus: (urn: string) =>
    axiosInstance.get<ApiResponse<TranslationStatusResult>>(
      `/viewer/models/${encodeURIComponent(urn)}/status`,
    ),
};
