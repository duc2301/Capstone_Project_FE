import { isAxiosError } from 'axios';

import type { ApiResponse } from '@/shared/api';
import { axiosInstance, getApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

import type {
  DiscussionMention,
  DiscussionMessage,
  MessageAttachment,
  MessageAttachmentType,
  PostDiscussionMessagePayload,
} from '../model/discussion.types';
import { MessageAttachmentTypeValue } from '../model/discussion.types';

interface RawDiscussionMention {
  accountId: string;
  name?: string | null;
}

interface RawMessageAttachment {
  id: string;
  type: number | string;
  fileVersionId?: string | null;
  url?: string | null;
  folderId?: string | null;
}

interface RawDiscussionMessage {
  id: string;
  discussionId: string;
  content: string;
  authorAccountId: string;
  authorName?: string | null;
  isSolution: boolean;
  replyToMessageId?: string | null;
  createdAt?: string | null;
  attachments?: RawMessageAttachment[] | null;
  mentions?: RawDiscussionMention[] | null;
}

function unwrap<T>(data: ApiResponse<T>): T {
  if (!data.isSuccess) throw new Error(data.message || 'Co loi xay ra.');
  return data.result as T;
}

function normalizeAttachmentType(value: number | string): MessageAttachmentType {
  if (value === 1 || value === 'Image') return 'Image';
  if (value === 2 || value === 'Link') return 'Link';
  if (value === 3 || value === 'CitedFolder') return 'CitedFolder';
  return 'File';
}

function mapMention(item: RawDiscussionMention): DiscussionMention {
  return { accountId: item.accountId, name: item.name ?? null };
}

function mapAttachment(item: RawMessageAttachment): MessageAttachment {
  return {
    id: item.id,
    type: normalizeAttachmentType(item.type),
    fileVersionId: item.fileVersionId ?? null,
    url: item.url ?? null,
    folderId: item.folderId ?? null,
  };
}

function mapMessage(item: RawDiscussionMessage): DiscussionMessage {
  return {
    id: item.id,
    discussionId: item.discussionId,
    content: item.content,
    authorAccountId: item.authorAccountId,
    authorName: item.authorName ?? null,
    isSolution: item.isSolution,
    replyToMessageId: item.replyToMessageId ?? null,
    createdAt: item.createdAt ?? null,
    attachments: (item.attachments ?? []).map(mapAttachment),
    mentions: (item.mentions ?? []).map(mapMention),
  };
}

export const discussionApi = {
  getMessages: async (discussionId: string): Promise<DiscussionMessage[]> => {
    const { data } = await axiosInstance.get<ApiResponse<RawDiscussionMessage[]>>(
      `/discussions/${discussionId}/messages`,
    );
    return (unwrap(data) ?? []).map(mapMessage);
  },

  postMessage: async (
    discussionId: string,
    payload: PostDiscussionMessagePayload,
  ): Promise<DiscussionMessage> => {
    const { data } = await axiosInstance.post<ApiResponse<RawDiscussionMessage>>(
      `/discussions/${discussionId}/messages`,
      {
        ...payload,
        attachments: payload.attachments?.map((a) => ({
          ...a,
          type: MessageAttachmentTypeValue[a.type],
        })),
      },
    );
    return mapMessage(unwrap(data));
  },
};

export function discussionErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.status === 403) {
    return t('issues.error.forbidden');
  }
  return getApiErrorMessage(err, fallback);
}
