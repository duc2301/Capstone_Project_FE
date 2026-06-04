import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { ChangePasswordPayload, Profile, UpdateProfilePayload } from '../model/profile.types';

export const profileApi = {
  /** GET /api/profile — current user profile (JWT-authenticated) */
  get: () =>
    axiosInstance.get<ApiResponse<Profile>>('/profile'),

  /** PUT /api/profile — partial update (userName, email) */
  update: (payload: UpdateProfilePayload) =>
    axiosInstance.put<ApiResponse<Profile>>('/profile', payload),

  /** POST /api/profile/change-password */
  changePassword: (payload: ChangePasswordPayload) =>
    axiosInstance.post<ApiResponse<null>>('/profile/change-password', payload),
};
