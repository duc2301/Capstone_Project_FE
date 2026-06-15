import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { isAccountAdmin, useSession } from '@/entities/session';

interface Props {
  children: ReactNode;
}

export const RequireAdmin = ({ children }: Props) => {
  const { currentUser } = useSession();

  if (!isAccountAdmin(currentUser?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
