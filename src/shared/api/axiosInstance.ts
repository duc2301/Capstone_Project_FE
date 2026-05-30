import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';

import { authStorage } from '@/shared/lib/storage';
import type { ApiResponse } from './apiResponse.types';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) throw new Error('Missing refresh token');

  const { data } = await axios.post<ApiResponse<RefreshResult>>(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (!data.isSuccess || !data.result) throw new Error(data.message);

  authStorage.setTokens(data.result);
  return data.result.accessToken;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const shouldRefresh =
      error.response?.status === 401 && originalRequest && !originalRequest._retry;

    if (!shouldRefresh) return Promise.reject(error);

    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshAccessToken();
      const newToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return await axiosInstance(originalRequest);
    } catch (refreshError) {
      authStorage.clear();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  },
);

export default axiosInstance;
