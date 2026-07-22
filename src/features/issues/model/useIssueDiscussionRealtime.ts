import { useEffect, useRef } from 'react';

import type { DiscussionMessage } from '@/entities/discussion';
import { normalizeDiscussionMessage } from '@/entities/discussion';
import { SIGNALR_EVENTS, SIGNALR_HUBS, SIGNALR_MARKUP_METHODS } from '@/shared/config';
import { createHubConnection } from '@/shared/lib/signalr';

export function useIssueDiscussionRealtime(
  fileItemId: string | null | undefined,
  discussionId: string | null | undefined,
  onMessage: (message: DiscussionMessage) => void,
): void {
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!fileItemId || !discussionId) return;

    let cancelled = false;
    const connection = createHubConnection(SIGNALR_HUBS.markup);

    connection.on(SIGNALR_EVENTS.discussionMessagePosted, (raw: { discussionId?: string }) => {
      if (cancelled || !raw || raw.discussionId !== discussionId) return;
      onMessageRef.current(normalizeDiscussionMessage(raw as Parameters<typeof normalizeDiscussionMessage>[0]));
    });

    const startPromise = connection
      .start()
      .then(() => (cancelled ? undefined : connection.invoke(SIGNALR_MARKUP_METHODS.joinFile, fileItemId)))
      .catch(() => undefined);

    return () => {
      cancelled = true;
      void startPromise.finally(() =>
        connection
          .invoke(SIGNALR_MARKUP_METHODS.leaveFile, fileItemId)
          .catch(() => undefined)
          .finally(() => connection.stop().catch(() => undefined)),
      );
    };
  }, [fileItemId, discussionId]);
}
