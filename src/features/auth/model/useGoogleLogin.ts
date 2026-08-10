import type { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getPostLoginPath, sessionApi, useSession } from '@/entities/session';
import type { ApiResponse } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

interface UseGoogleLoginReturn {
  loading: boolean;
  error: string | null;
  handleGoogleCredential: (credential: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export function useGoogleLogin(): UseGoogleLoginReturn {
  const navigate = useNavigate();
  const { signIn } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setLoading(true);
      setError(null);

      try {
        // credential ở đây là ID Token (JWT) từ Google
        const { data } = await sessionApi.googleLogin(credential);

        if (!data.isSuccess || !data.result) {
          setError(data.message || t('auth.google.loginFailed'));
          return;
        }

        signIn(data.result);
        navigate(getPostLoginPath(), { replace: true });
      } catch (err) {
        const axiosError = err as AxiosError<ApiResponse>;
        setError(
          axiosError.response?.data?.message ||
          t('auth.google.loginFailed'),
        );
      } finally {
        setLoading(false);
      }
    },
    [navigate, signIn],
  );

  return { loading, error, handleGoogleCredential, setError };
}
