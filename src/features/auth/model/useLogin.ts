import type { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { LoginPayload } from '@/entities/session';
import { AccountRole, sessionApi, useSession } from '@/entities/session';
import type { ApiResponse } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

interface UseLoginReturn {
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
}

export function useLogin(): UseLoginReturn {
  const navigate = useNavigate();
  const { signIn } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await sessionApi.login(payload);

        if (!data.isSuccess || !data.result) {
          setError(data.message || t('login.error.invalidCredentials'));
          return;
        }

        signIn(data.result);

        if (data.result.role === AccountRole.Admin) {
          navigate('/accounts', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (err) {
        const axiosError = err as AxiosError<ApiResponse>;

        if (axiosError.response?.status === 401) {
          setError(t('login.error.invalidCredentials'));
        } else {
          setError(
            axiosError.response?.data?.message || t('login.error.generic'),
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [navigate, signIn],
  );

  return { loading, error, login };
}
