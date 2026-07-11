import { isAxiosError } from 'axios';

import type { ApiResponse } from '@/shared/api';
import { axiosInstance, getApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

import type {
  CreateIssuePayload,
  IssueAttachment,
  IssueItem,
  IssueParticipant,
  IssuePriority,
  IssueStatus,
  IssueType,
} from '../model/issue.types';

interface RawIssueParticipant {
  accountId: string;
  name?: string | null;
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
  if (value === 2 || value === 'Answered') return 'Answered';
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

const IssueTypeValue: Record<IssueType, number> = { Issue: 0, Rfi: 1 };
const IssueStatusValue: Record<IssueStatus, number> = { Open: 0, InProgress: 1, Answered: 2, Closed: 3 };
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

export const issueApi = {
  getByFileItem: async (fileItemId: string): Promise<IssueItem[]> => {
    const { data } = await axiosInstance.get<ApiResponse<RawIssueItem[]>>(
      `/issues/by-file/${fileItemId}`,
    );
    return (unwrap(data) ?? []).map(mapIssueItem);
  },

  getById: async (issueId: string): Promise<IssueItem> => {
    const { data } = await axiosInstance.get<ApiResponse<RawIssueItem>>(`/issues/${issueId}`);
    return mapIssueItem(unwrap(data));
  },

  create: async (payload: CreateIssuePayload): Promise<IssueItem> => {
    const { data } = await axiosInstance.post<ApiResponse<RawIssueItem>>('/issues', {
      ...payload,
      type: IssueTypeValue[payload.type],
      status: IssueStatusValue[payload.status],
      priority: IssuePriorityValue[payload.priority],
    });
    return mapIssueItem(unwrap(data));
  },

  resolve: async (issueId: string): Promise<IssueItem> => {
    const { data } = await axiosInstance.post<ApiResponse<RawIssueItem>>(`/issues/${issueId}/resolve`);
    return mapIssueItem(unwrap(data));
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

  uploadAttachment: async (issueId: string, file: File): Promise<IssueAttachment> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await axiosInstance.post<ApiResponse<RawIssueAttachment>>(
      `/issues/${issueId}/attachments`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return mapAttachment(unwrap(data));
  },

  // Dung de FE tu ghep co "Dang xu ly issue" vao cac bang danh sach file khac (vd DocumentsTab) ma
  // khong can BE cua trang do phai biet ve Issue.
  getOpenIssueFileIds: async (fileItemIds: string[]): Promise<string[]> => {
    if (fileItemIds.length === 0) return [];
    const { data } = await axiosInstance.post<ApiResponse<string[]>>(
      '/issues/open-file-ids',
      { fileItemIds },
    );
    return unwrap(data) ?? [];
  },
};

export function issueErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.status === 403) {
    return t('issues.error.forbidden');
  }
  return getApiErrorMessage(err, fallback);
}
