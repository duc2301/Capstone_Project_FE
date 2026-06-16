export const GroupMemberStatus = {
  Active: 0,
  Left: 1,
} as const;
export type GroupMemberStatus = (typeof GroupMemberStatus)[keyof typeof GroupMemberStatus];

export interface GroupMember {
  accountId: string;
  userName: string;
  email?: string | null;
  role: number;
  status: GroupMemberStatus;
  joinedAt?: string | null;
}

export interface ChangeMemberRolePayload {
  role: number;
}

export interface ChangeMemberStatusPayload {
  status: GroupMemberStatus;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  organizationId?: string | null;
  createdAt?: string | null;
  members: GroupMember[];
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  organizationId?: string;
}
