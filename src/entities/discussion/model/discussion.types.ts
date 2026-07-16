export type MessageAttachmentType = 'File' | 'Image' | 'Link' | 'CitedFolder';

/* Gia tri so gui len BE (enum khong dung JsonStringEnumConverter) */
export const MessageAttachmentTypeValue: Record<MessageAttachmentType, number> = {
  File: 0,
  Image: 1,
  Link: 2,
  CitedFolder: 3,
};

export interface DiscussionMention {
  accountId: string;
  name: string | null;
}

export interface MessageAttachment {
  id: string;
  type: MessageAttachmentType;
  fileVersionId: string | null;
  url: string | null;
  folderId: string | null;
}

export interface DiscussionMessage {
  id: string;
  discussionId: string;
  content: string;
  authorAccountId: string;
  authorName: string | null;
  isSolution: boolean;
  replyToMessageId: string | null;
  createdAt: string | null;
  attachments: MessageAttachment[];
  mentions: DiscussionMention[];
}

export interface PostMessageAttachmentPayload {
  type: MessageAttachmentType;
  fileVersionId?: string;
  url?: string;
  folderId?: string;
}

export interface PostDiscussionMessagePayload {
  content: string;
  replyToMessageId?: string;
  attachments?: PostMessageAttachmentPayload[];
  mentionedAccountIds?: string[];
}
