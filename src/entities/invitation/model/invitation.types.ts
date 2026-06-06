export const GroupMemberRole = {
  Member: 0,
  Leader: 1,
} as const;
export type GroupMemberRole = (typeof GroupMemberRole)[keyof typeof GroupMemberRole];

export const InvitationStatus = {
  Pending: 0,
  Accepted: 1,
  Rejected: 2,
  Expired: 3,
} as const;
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

export interface MyInvitation {
  id: string;
  projectId: string;
  projectName: string;
  invitedGroupId: string;
  groupName: string;
  role: GroupMemberRole;
  invitedByAccountId?: string | null;
  invitedByName?: string | null;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  note?: string | null;
}

export interface InvitationResponse {
  id: string;
  projectId: string;
  invitedAccountId?: string | null;
  invitedGroupId?: string | null;
  role: GroupMemberRole;
  invitedByAccountId?: string | null;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  respondedAt?: string | null;
  note?: string | null;
}

export interface InvitePayload {
  projectId: string;
  invitedAccountId: string;
  invitedGroupId: string;
  role: GroupMemberRole;
  expireDays?: number;
  note?: string;
}
