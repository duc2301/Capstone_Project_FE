import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { NotificationPage, NotificationQuery } from '../model/notification.types';

export const notificationApi = {
  getMine: (query: NotificationQuery = {}) =>
    axiosInstance.get<ApiResponse<NotificationPage>>('/notifications/me', { params: query }),

  markRead: (id: string) =>
    axiosInstance.post<ApiResponse<null>>(`/notifications/${id}/read`),

  markAllRead: () =>
    axiosInstance.post<ApiResponse<null>>('/notifications/read-all'),
};
