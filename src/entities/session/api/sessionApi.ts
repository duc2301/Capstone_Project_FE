import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  AuthResult,
  LoginPayload,
  LogoutPayload,
  RefreshPayload,
  RegisterPayload,
  ResendOtpPayload,
  VerifyOtpPayload,
} from '../model/session.types';

export const sessionApi = {
  login: (payload: LoginPayload) =>
    axiosInstance.post<ApiResponse<AuthResult>>('/auth/login', payload),

  register: (payload: RegisterPayload) =>
    axiosInstance.post<ApiResponse<AuthResult>>('/auth/register', payload),

  googleLogin: (idToken: string) =>
    axiosInstance.post<ApiResponse<AuthResult>>('/auth/google-login', { idToken }),

  refresh: (payload: RefreshPayload) =>
    axiosInstance.post<ApiResponse<AuthResult>>('/auth/refresh', payload),

  logout: (payload: LogoutPayload) =>
    axiosInstance.post<ApiResponse<null>>('/auth/logout', payload),

  forgotPassword: (email: string) =>
    axiosInstance.post<ApiResponse<null>>('/auth/forgot-password', { email }),

  resetPassword: (email: string, token: string, newPassword: string) =>
    axiosInstance.post<ApiResponse<null>>('/auth/reset-password', { email, token, newPassword }),

  verifyOtp: (payload: VerifyOtpPayload) =>
    axiosInstance.post<ApiResponse<AuthResult>>('/auth/verify-otp', payload),

  resendOtp: (payload: ResendOtpPayload) =>
    axiosInstance.post<ApiResponse<null>>('/auth/resend-otp', payload),
};
