export const ProjectStatus = {
  Planning: 0,
  Active: 1,
  OnHold: 2,
  Completed: 3,
  Closed: 4,
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const ProjectPhase = {
  Concept: 0,
  Design: 1,
  Construction: 2,
  Handover: 3,
  Operation: 4,
} as const;
export type ProjectPhase = (typeof ProjectPhase)[keyof typeof ProjectPhase];

export interface ProjectLocation {
  id: string;
  projectId: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt?: string | null;
}

export interface ProjectModel {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  createdAt?: string | null;
}

export interface Project {
  id: string;
  projectName: string;
  projectDescription?: string | null;
  managerAccountId?: string | null;
  status: ProjectStatus;
  phase: ProjectPhase;
  location?: ProjectLocation | null;
  models?: ProjectModel[];
}

export interface CreateProjectPayload {
  projectName: string;
  projectDescription?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface AssignManagerPayload {
  accountId: string;
}

export const ProjectParticipantRole = {
  ProjectAdmin: 0,
  Member: 1,
} as const;
export type ProjectParticipantRole =
  (typeof ProjectParticipantRole)[keyof typeof ProjectParticipantRole];

export interface Participant {
  id: string;
  projectId: string;
  groupId: string;
  role: ProjectParticipantRole;
  joinedAt?: string | null;
}

export interface AddParticipantPayload {
  groupId: string;
  role: ProjectParticipantRole;
}

export interface AddParticipantsBulkPayload {
  participants: AddParticipantPayload[];
}
