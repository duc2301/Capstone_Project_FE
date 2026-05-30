import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { sessionApi, useSession } from '@/entities/session';
import { authStorage } from '@/shared/lib/storage';

interface UseLogoutReturn {
  loading: boolean;
  logout: () => Promise<void>;
}

export function useLogout(): UseLogoutReturn {
  const navigate = useNavigate();
  const { signOut } = useSession();
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async () => {
    setLoading(true);

    // Báo server thu hồi refresh token; lỗi mạng/logout không nên chặn việc
    // đăng xuất phía client, nên nuốt lỗi bằng .catch().
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      await sessionApi.logout({ refreshToken }).catch(() => undefined);
    }

    signOut();
    setLoading(false);
    navigate('/login', { replace: true });
  }, [navigate, signOut]);

  return { loading, logout };
}
