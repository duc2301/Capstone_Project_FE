export const SIGNALR_HUBS = {
  notifications: '/hubs/notifications',
  markup: '/hubs/markup',
} as const;

export const SIGNALR_EVENTS = {
  receiveNotification: 'ReceiveNotification',
  markupNoteAdded: 'MarkupNoteAdded',
  markupNoteUpdated: 'MarkupNoteUpdated',
  markupNoteDeleted: 'MarkupNoteDeleted',
  approvalChanged: 'ApprovalChanged',
  issueCreated: 'IssueCreated',
  issueUpdated: 'IssueUpdated',
  discussionMessagePosted: 'DiscussionMessagePosted',
} as const;
export const SIGNALR_MARKUP_METHODS = {
  joinFile: 'JoinFile',
  leaveFile: 'LeaveFile',
} as const;
