import { isAxiosError } from 'axios';

import type { ApiResponse } from '@/shared/api';
import { axiosInstance, getApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

import type {
  AssignableGroup,
  AssignableMember,
  CreateIssuePayload,
  IssueAttachment,
  IssueItem,
  IssueParticipant,
  IssuePriority,
  IssueStatus,
  IssueType,
  ProjectIssueListItem,
} from '../model/issue.types';

interface RawAssignableGroup {
  groupId: string;
  groupName?: string | null;
  organizationName?: string | null;
  memberCount?: number | null;
}

interface RawIssueParticipant {
  accountId: string;
  name?: string | null;
}

interface RawAssignableMember {
  accountId: string;
  name: string;
  email?: string | null;
  groupId: string;
  groupName: string;
}

interface RawIssueAttachment {
  id: string;
  url?: string | null;
  fileVersionId?: string | null;
}

interface RawIssueItem {
  id: string;
  projectId: string;
  type: number | string;
  title: string;
  description?: string | null;
  status: number | string;
  priority: number | string;
  raisedByAccountId?: string | null;
  raisedByName?: string | null;
  assignedToAccountId?: string | null;
  assignedToName?: string | null;
  assignedToOrganizationId?: string | null;
  assignedToOrganizationName?: string | null;
  assignedToGroupId?: string | null;
  assignedToGroupName?: string | null;
  dueDate?: string | null;
  linkedFolderId?: string | null;
  linkedFileItemId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  participants?: RawIssueParticipant[] | null;
  discussionId?: string | null;
  linkedReturnRequestStatus?: string | null;
  attachments?: RawIssueAttachment[] | null;
}

function unwrap<T>(data: ApiResponse<T>): T {
  if (!data.isSuccess) throw new Error(data.message || 'Co loi xay ra.');
  return data.result as T;
}

function normalizeIssueType(value: number | string): IssueType {
  if (value === 1 || value === 'Rfi') return 'Rfi';
  return 'Issue';
}

function normalizeIssueStatus(value: number | string): IssueStatus {
  if (value === 1 || value === 'InProgress') return 'InProgress';
  if (value === 2 || value === 'Answered') return 'InProgress';
  if (value === 3 || value === 'Closed') return 'Closed';
  return 'Open';
}

function normalizeIssuePriority(value: number | string): IssuePriority {
  if (value === 1 || value === 'Medium') return 'Medium';
  if (value === 2 || value === 'High') return 'High';
  if (value === 3 || value === 'Critical') return 'Critical';
  return 'Low';
}

function mapParticipant(item: RawIssueParticipant): IssueParticipant {
  return { accountId: item.accountId, name: item.name ?? null };
}

function mapAttachment(item: RawIssueAttachment): IssueAttachment {
  return { id: item.id, url: item.url ?? null, fileVersionId: item.fileVersionId ?? null };
}

function mapAssignableMember(item: RawAssignableMember): AssignableMember {
  return {
    accountId: item.accountId,
    name: item.name,
    email: item.email ?? null,
    groupId: item.groupId,
    groupName: item.groupName,
  };
}

const IssueTypeValue: Record<IssueType, number> = { Issue: 0, Rfi: 1 };
const IssuePriorityValue: Record<IssuePriority, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 };

function mapIssueItem(item: RawIssueItem): IssueItem {
  return {
    id: item.id,
    projectId: item.projectId,
    type: normalizeIssueType(item.type),
    title: item.title,
    description: item.description ?? null,
    status: normalizeIssueStatus(item.status),
    priority: normalizeIssuePriority(item.priority),
    raisedByAccountId: item.raisedByAccountId ?? null,
    raisedByName: item.raisedByName ?? null,
    assignedToAccountId: item.assignedToAccountId ?? null,
    assignedToName: item.assignedToName ?? null,
    assignedToOrganizationId: item.assignedToOrganizationId ?? null,
    assignedToOrganizationName: item.assignedToOrganizationName ?? null,
    assignedToGroupId: item.assignedToGroupId ?? null,
    assignedToGroupName: item.assignedToGroupName ?? null,
    dueDate: item.dueDate ?? null,
    linkedFolderId: item.linkedFolderId ?? null,
    linkedFileItemId: item.linkedFileItemId ?? null,
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
    participants: (item.participants ?? []).map(mapParticipant),
    discussionId: item.discussionId ?? null,
    linkedReturnRequestStatus: item.linkedReturnRequestStatus ?? null,
    attachments: (item.attachments ?? []).map(mapAttachment),
  };
}

interface RawProjectIssueListItem {
  assignedToGroupId?: string | null;
  assignedToGroupName?: string | null;
  id: string;
  projectId: string;
  projectName?: string | null;
  type: number | string;
  title: string;
  description?: string | null;
  status: number | string;
  priority: number | string;
  raisedByAccountId?: string | null;
  raisedByName?: string | null;
  assignedToAccountId?: string | null;
  assignedToName?: string | null;
  dueDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  linkedFileItemId?: string | null;
  linkedFileName?: string | null;
  linkedFolderId?: string | null;
  linkedFolderName?: string | null;
}

interface RawProjectIssuePage {
  items: RawProjectIssueListItem[];
  total: number;
  page: number;
  pageSize: number;
}

function mapProjectIssueListItem(item: RawProjectIssueListItem): ProjectIssueListItem {
  return {
    id: item.id,
    projectId: item.projectId,
    projectName: item.projectName ?? null,
    type: normalizeIssueType(item.type),
    title: item.title,
    description: item.description ?? null,
    status: normalizeIssueStatus(item.status),
    priority: normalizeIssuePriority(item.priority),
    raisedByAccountId: item.raisedByAccountId ?? null,
    raisedByName: item.raisedByName ?? null,
    assignedToAccountId: item.assignedToAccountId ?? null,
    assignedToName: item.assignedToName ?? null,
    assignedToGroupId: item.assignedToGroupId ?? null,
    assignedToGroupName: item.assignedToGroupName ?? null,
    dueDate: item.dueDate ?? null,
    createdAt: item.createdAt ?? null,
    updatedAt: item.updatedAt ?? null,
    linkedFileItemId: item.linkedFileItemId ?? null,
    linkedFileName: item.linkedFileName ?? null,
    linkedFolderId: item.linkedFolderId ?? null,
    linkedFolderName: item.linkedFolderName ?? null,
  };
}

export const issueApi = {
  getByFileItem: async (fileItemId: string): Promise<IssueItem[]> => {
    const { data } = await axiosInstance.get<ApiResponse<RawIssueItem[]>>(
      `/issues/by-file/${fileItemId}`,
    );
    return (unwrap(data) ?? []).map(mapIssueItem);
  },

  /** Issue toan du an; BE da loc theo quyen View thu muc cua nguoi goi. */
  getByProject: async (projectId: string, page = 1, pageSize = 100): Promise<ProjectIssueListItem[]> => {
    const { data } = await axiosInstance.get<ApiResponse<RawProjectIssuePage>>(
      `/issues/by-project/${projectId}`,
      { params: { page, pageSize } },
    );
    return (unwrap(data)?.items ?? []).map(mapProjectIssueListItem);
  },

  getForMyProjects: async (page = 1, pageSize = 100): Promise<ProjectIssueListItem[]> => {
    const { data } = await axiosInstance.get<ApiResponse<RawProjectIssuePage>>(
      '/issues/my-projects',
      { params: { page, pageSize } },
    );
    return (unwrap(data)?.items ?? []).map(mapProjectIssueListItem);
  },

  getAssignedToMe: async (page = 1, pageSize = 100): Promise<ProjectIssueListItem[]> => {
    const { data } = await axiosInstance.get<ApiResponse<RawProjectIssuePage>>(
      '/issues/assigned-to-me',
      { params: { page, pageSize } },
    );
    return (unwrap(data)?.items ?? []).map(mapProjectIssueListItem);
  },

  getById: async (issueId: string): Promise<IssueItem> => {
    const { data } = await axiosInstance.get<ApiResponse<RawIssueItem>>(`/issues/${issueId}`);
    return mapIssueItem(unwrap(data));
  },

  create: async (payload: CreateIssuePayload): Promise<IssueItem> => {
    const { data } = await axiosInstance.post<ApiResponse<RawIssueItem>>('/issues', {
      ...payload,
      type: IssueTypeValue[payload.type],
      priority: IssuePriorityValue[payload.priority],
    });
    return mapIssueItem(unwrap(data));
  },

  resolve: async (issueId: string): Promise<IssueItem> => {
    const { data } = await axiosInstance.post<ApiResponse<RawIssueItem>>(`/issues/${issueId}/resolve`);
    return mapIssueItem(unwrap(data));
  },

  getAssignableGroups: async (fileItemId: string): Promise<AssignableGroup[]> => {
    const { data } = await axiosInstance.get<ApiResponse<RawAssignableGroup[]>>(
      `/issues/assignable-groups/${fileItemId}`,
    );
    return (unwrap(data) ?? []).map((g) => ({
      groupId: g.groupId,
      groupName: g.groupName ?? '',
      organizationName: g.organizationName ?? null,
      memberCount: g.memberCount ?? 0,
    }));
  },

  addParticipant: async (issueId: string, accountId: string): Promise<void> => {
    const { data } = await axiosInstance.post<ApiResponse<unknown>>(
      `/issues/${issueId}/participants`,
      { accountId },
    );
    unwrap(data);
  },

  removeParticipant: async (issueId: string, accountId: string): Promise<void> => {
    const { data } = await axiosInstance.delete<ApiResponse<unknown>>(
      `/issues/${issueId}/participants/${accountId}`,
    );
    unwrap(data);
  },

  getOpenIssueFileIds: async (fileItemIds: string[]): Promise<string[]> => {
    if (fileItemIds.length === 0) return [];
    const { data } = await axiosInstance.post<ApiResponse<string[]>>(
      '/issues/open-file-ids',
      { fileItemIds },
    );
    return unwrap(data) ?? [];
  },
  getAssignableMembers: async (fileItemId: string): Promise<AssignableMember[]> => {
    const { data } = await axiosInstance.get<ApiResponse<RawAssignableMember[]>>(
      `/issues/assignable-members/${fileItemId}`,
    );
    return (unwrap(data) ?? []).map(mapAssignableMember);
  },
};

export function issueErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.status === 403) {
    return t('issues.error.forbidden');
  }
  return getApiErrorMessage(err, fallback);
}
