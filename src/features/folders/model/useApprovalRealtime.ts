import { useEffect, useRef } from 'react';

import type { ApprovalListItem } from '@/entities/approval';
import { SIGNALR_EVENTS, SIGNALR_HUBS } from '@/shared/config';
import { createHubConnection } from '@/shared/lib/signalr';

/**
 * Lắng nghe sự kiện "ApprovalChanged" đẩy qua NotificationHub (per-user) — dùng để tự vá
 * (upsert/remove) danh sách approval đang mở, không cần refetch API nên không nháy trang.
 */
export function useApprovalRealtime(onChanged: (approval: ApprovalListItem) => void): void {
  const onChangedRef = useRef(onChanged);
  useEffect(() => {
    onChangedRef.current = onChanged;
  });

  useEffect(() => {
    let cancelled = false;
    const connection = createHubConnection(SIGNALR_HUBS.notifications);

    connection.on(SIGNALR_EVENTS.approvalChanged, (approval: ApprovalListItem) => {
      if (!cancelled) onChangedRef.current(approval);
    });

    const startPromise = connection.start().catch(() => undefined);

    return () => {
      cancelled = true;
      void startPromise.finally(() => connection.stop().catch(() => undefined));
    };
  }, []);
}
