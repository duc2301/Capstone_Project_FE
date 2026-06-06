import type { FC, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { NotificationProvider } from '@/entities/notification';
import { SessionProvider, useSession } from '@/entities/session';

interface Props {
  children: ReactNode;
}

const NotificationGate: FC<Props> = ({ children }) => {
  const { currentUser } = useSession();
  return (
    <NotificationProvider accountId={currentUser?.accountId ?? null}>
      {children}
    </NotificationProvider>
  );
};

export const AppProvider: FC<Props> = ({ children }) => {
  return (
    <BrowserRouter>
      <SessionProvider>
        <NotificationGate>{children}</NotificationGate>
      </SessionProvider>
    </BrowserRouter>
  );
};
