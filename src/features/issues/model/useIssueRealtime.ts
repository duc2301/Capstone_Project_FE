import { useEffect, useRef } from 'react';

import type { IssueItem } from '@/entities/issue';
import { SIGNALR_EVENTS, SIGNALR_HUBS, SIGNALR_MARKUP_METHODS } from '@/shared/config';
import { createHubConnection } from '@/shared/lib/signalr';

export interface IssueRealtimeHandlers {
  onIssueCreated?: (issue: IssueItem) => void;
  onIssueUpdated?: (issue: IssueItem) => void;
}

/**
 * Lắng nghe "IssueCreated"/"IssueUpdated" qua MarkupHub (room theo fileItemId, tái dùng room có sẵn
 * cho markup) — dùng để tự vá danh sách issue của file đang mở, không cần refetch API.
 */
export function useIssueRealtime(fileItemId: string | undefined, handlers: IssueRealtimeHandlers): void {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!fileItemId) return;

    let cancelled = false;
    const connection = createHubConnection(SIGNALR_HUBS.markup);

    connection.on(SIGNALR_EVENTS.issueCreated, (issue: IssueItem) => {
      if (!cancelled) handlersRef.current.onIssueCreated?.(issue);
    });
    connection.on(SIGNALR_EVENTS.issueUpdated, (issue: IssueItem) => {
      if (!cancelled) handlersRef.current.onIssueUpdated?.(issue);
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
  }, [fileItemId]);
}
