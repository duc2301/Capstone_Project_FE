export interface GroupMember {
  accountId: string;
  userName: string;
  email?: string | null;
  role: number;
  joinedAt?: string | null;
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
