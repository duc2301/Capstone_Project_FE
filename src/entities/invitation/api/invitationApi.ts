import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  InvitationResponse,
  InvitePayload,
  MyInvitation,
} from '../model/invitation.types';

export const invitationApi = {
  getMyPending: () =>
    axiosInstance.get<ApiResponse<MyInvitation[]>>('/project-invitations/me'),

  accept: (id: string) =>
    axiosInstance.post<ApiResponse<InvitationResponse>>(`/project-invitations/${id}/accept`),

  reject: (id: string) =>
    axiosInstance.post<ApiResponse<InvitationResponse>>(`/project-invitations/${id}/reject`),

  invite: (payload: InvitePayload) =>
    axiosInstance.post<ApiResponse<InvitationResponse>>('/project-invitations', payload),
};
