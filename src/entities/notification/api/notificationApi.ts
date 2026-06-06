import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { NotificationItem } from '../model/notification.types';

export const notificationApi = {
  getMine: () =>
    axiosInstance.get<ApiResponse<NotificationItem[]>>('/notifications/me'),

  markRead: (id: string) =>
    axiosInstance.post<ApiResponse<null>>(`/notifications/${id}/read`),
};
