import type { FC, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { SessionProvider } from '@/entities/session';

interface Props {
  children: ReactNode;
}

export const AppProvider: FC<Props> = ({ children }) => {
  return (
    <BrowserRouter>
      <SessionProvider>{children}</SessionProvider>
    </BrowserRouter>
  );
};
