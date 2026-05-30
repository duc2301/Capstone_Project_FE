import { useContext } from 'react';

import type { SessionContextValue } from './sessionContext';
import { SessionContext } from './sessionContext';
export const useSession = (): SessionContextValue => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession phải được dùng bên trong <SessionProvider>.');
  }
  return context;
};
