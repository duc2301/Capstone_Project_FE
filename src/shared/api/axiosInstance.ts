import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // TODO: refresh token khi accessToken hết hạn
      // try {
      //   const refreshToken = localStorage.getItem('refreshToken');
      //   const { data } = await axios.post<ApiResponse<{ accessToken: string }>>(
      //     `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`,
      //     { refreshToken },
      //   );
      //   const newToken = data.result?.accessToken ?? '';
      //   localStorage.setItem('accessToken', newToken);
      //   originalRequest.headers.Authorization = `Bearer ${newToken}`;
      //   return axiosInstance(originalRequest);
      // } catch {
      //   localStorage.removeItem('accessToken');
      //   localStorage.removeItem('refreshToken');
      //   window.location.href = '/login';
      // }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
