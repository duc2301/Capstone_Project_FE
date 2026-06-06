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

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';
