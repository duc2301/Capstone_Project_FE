import type { HubConnection } from '@microsoft/signalr';
import type { FC, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SIGNALR_EVENTS, SIGNALR_HUBS } from '@/shared/config';
import { createHubConnection } from '@/shared/lib/signalr';
import { notificationApi } from '../api/notificationApi';
import type { NotificationItem, RealtimeStatus } from './notification.types';
import { NotificationContext } from './notificationContext';

interface Props {
  accountId: string | null;
  children: ReactNode;
}

/**
 * Dừng kết nối SignalR một cách an toàn: chờ start() settle rồi mới stop,
 * tránh lỗi "stopped during negotiation" khi React StrictMode mount/unmount 2 lần.
 */
function stopConnectionQuietly(
  connection: HubConnection,
  startPromise: Promise<unknown>,
): void {
  void startPromise.finally(() => connection.stop().catch(() => undefined));
}

export const NotificationProvider: FC<Props> = ({ accountId, children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<RealtimeStatus>('idle');

  const connectionRef = useRef<HubConnection | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const refresh = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const { data } = await notificationApi.getMine();
      if (data.isSuccess && data.result) setNotifications(data.result);
    } catch {
      // Lỗi mạng khi tải lại — giữ nguyên danh sách hiện tại, người dùng có thể thử lại.
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    try {
      await notificationApi.markRead(id);
    } catch {
      // Đã cập nhật lạc quan trên UI; bỏ qua lỗi gọi API nền.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => (n.isRead ? n : { ...n, isRead: true })));
    await Promise.allSettled(unreadIds.map((id) => notificationApi.markRead(id)));
  }, [notifications]);

  useEffect(() => {
    if (!accountId) return;

    let cancelled = false;

    const loadInitial = async () => {
      setLoading(true);
      try {
        const { data } = await notificationApi.getMine();
        if (!cancelled && data.isSuccess && data.result) {
          setNotifications(data.result);
        }
      } catch {
        // Lỗi tải lần đầu — realtime/refresh sau đó sẽ bù lại dữ liệu.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const connection = createHubConnection(SIGNALR_HUBS.notifications);
    connectionRef.current = connection;

    connection.on(SIGNALR_EVENTS.receiveNotification, (payload: NotificationItem) => {
      if (cancelled) return;
      setNotifications((prev) =>
        prev.some((n) => n.id === payload.id) ? prev : [payload, ...prev],
      );
    });

    connection.onreconnecting(() => !cancelled && setStatus('connecting'));
    connection.onreconnected(() => !cancelled && setStatus('connected'));
    connection.onclose(() => !cancelled && setStatus('disconnected'));

    void loadInitial();
    const startPromise = connection
      .start()
      .then(() => !cancelled && setStatus('connected'))
      .catch(() => !cancelled && setStatus('disconnected'));

    return () => {
      cancelled = true;
      connection.off(SIGNALR_EVENTS.receiveNotification);
      stopConnectionQuietly(connection, startPromise);
      connectionRef.current = null;
      setNotifications([]);
      setStatus('idle');
    };
  }, [accountId]);

  const value = useMemo(
    () => ({ notifications, unreadCount, loading, status, refresh, markRead, markAllRead }),
    [notifications, unreadCount, loading, status, refresh, markRead, markAllRead],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
