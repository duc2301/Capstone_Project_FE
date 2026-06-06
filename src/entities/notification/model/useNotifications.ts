import { useContext } from 'react';

import type { NotificationContextValue } from './notificationContext';
import { NotificationContext } from './notificationContext';

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications phải được dùng bên trong <NotificationProvider>.');
  }
  return context;
};
