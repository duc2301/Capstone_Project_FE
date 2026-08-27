import { useEffect, useRef } from 'react';

import { SIGNALR_EVENTS, SIGNALR_HUBS } from '@/shared/config';
import { createHubConnection } from '@/shared/lib/signalr';

interface GroupMemberRoleChangedPayload {
  groupId: string;
  newRole: string;
}

// BE chỉ gửi cho đúng account bị đổi vai trò, nên nhận được sự kiện này nghĩa là chính mình vừa bị đổi.
export function useGroupMemberRoleRealtime(onChanged: (payload: GroupMemberRoleChangedPayload) => void): void {
  const onChangedRef = useRef(onChanged);
  useEffect(() => {
    onChangedRef.current = onChanged;
  });

  useEffect(() => {
    let cancelled = false;
    const connection = createHubConnection(SIGNALR_HUBS.notifications);

    connection.on(SIGNALR_EVENTS.groupMemberRoleChanged, (payload: GroupMemberRoleChangedPayload) => {
      if (!cancelled) onChangedRef.current(payload);
    });

    const startPromise = connection.start().catch(() => undefined);

    return () => {
      cancelled = true;
      void startPromise.finally(() => connection.stop().catch(() => undefined));
    };
  }, []);
}
