import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  AuthResult,
  LoginPayload,
  LogoutPayload,
  RefreshPayload,
  RegisterPayload,
} from '../model/session.types';

export const sessionApi = {
  login: (payload: LoginPayload) =>
    axiosInstance.post<ApiResponse<AuthResult>>('/auth/login', payload),

  register: (payload: RegisterPayload) =>
    axiosInstance.post<ApiResponse<AuthResult>>('/auth/register', payload),

  refresh: (payload: RefreshPayload) =>
    axiosInstance.post<ApiResponse<AuthResult>>('/auth/refresh', payload),

  logout: (payload: LogoutPayload) =>
    axiosInstance.post<ApiResponse<null>>('/auth/logout', payload),
};
