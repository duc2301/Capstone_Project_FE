import { createContext } from 'react';

import type { AuthResult, CurrentUser } from './session.types';

export interface SessionContextValue {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  signIn: (result: AuthResult) => void;
  signOut: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
