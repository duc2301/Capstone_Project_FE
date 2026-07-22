import { useEffect, useRef } from 'react';

import { SIGNALR_EVENTS, SIGNALR_HUBS, SIGNALR_MARKUP_METHODS } from '@/shared/config';
import { createHubConnection } from '@/shared/lib/signalr';
import type { FileNote } from './fileNote.types';

export interface FileNoteRealtimeHandlers {
  onNoteAdded?: (note: FileNote) => void;
  onNoteUpdated?: (note: FileNote) => void;
  onNoteDeleted?: (noteId: string) => void;
}

interface DeletedPayload {
  fileItemId: string;
  noteId: string;
}

export function useFileNoteRealtime(
  fileItemId: string | null,
  handlers: FileNoteRealtimeHandlers,
): void {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!fileItemId) return;

    let cancelled = false;
    const connection = createHubConnection(SIGNALR_HUBS.markup);

    connection.on(SIGNALR_EVENTS.markupNoteAdded, (note: FileNote) => {
      if (!cancelled) handlersRef.current.onNoteAdded?.(note);
    });
    connection.on(SIGNALR_EVENTS.markupNoteUpdated, (note: FileNote) => {
      if (!cancelled) handlersRef.current.onNoteUpdated?.(note);
    });
    connection.on(SIGNALR_EVENTS.markupNoteDeleted, (payload: DeletedPayload) => {
      if (!cancelled) handlersRef.current.onNoteDeleted?.(payload.noteId);
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
