import type { FC, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { authStorage } from '@/shared/lib/storage';
import type { AuthResult, CurrentUser } from './session.types';
import { SessionContext } from './sessionContext';

const toCurrentUser = ({
  accountId,
  userName,
  email,
  role,
}: AuthResult): CurrentUser => ({ accountId, userName, email, role });

interface Props {
  children: ReactNode;
}

export const SessionProvider: FC<Props> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() =>
    authStorage.getUser<CurrentUser>(),
  );

  const signIn = useCallback((result: AuthResult) => {
    const user = toCurrentUser(result);
    authStorage.setTokens(result);
    authStorage.setUser(user);
    setCurrentUser(user);
  }, []);

  const signOut = useCallback(() => {
    authStorage.clear();
    setCurrentUser(null);
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: currentUser !== null,
      signIn,
      signOut,
    }),
    [currentUser, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
