export type NotificationLinkType = 'ProjectInvitation' | 'Project' | (string & {});

export interface NotificationItem {
  id: string;
  accountId: string;
  message: string;
  senderName: string;
  sendAt: string;
  isRead: boolean;
  linkType?: NotificationLinkType | null;
  linkId?: string | null;
}

export interface NotificationQuery {
  unreadOnly?: boolean;
  linkType?: string;
  search?: string;
  from?: string;
  page?: number;
  pageSize?: number;
}

export interface NotificationPage {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';
