import type { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getPostLoginPath, sessionApi, useSession } from '@/entities/session';
import type { ApiResponse } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

interface UseVerifyOtpReturn {
  loading: boolean;
  error: string | null;
  success: string | null;
  resending: boolean;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
}

export function useVerifyOtp(): UseVerifyOtpReturn {
  const navigate = useNavigate();
  const { signIn } = useSession();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const verifyOtp = useCallback(
    async (email: string, otp: string) => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const { data } = await sessionApi.verifyOtp({ email, otp });

        if (!data.isSuccess || !data.result) {
          setError(data.message || t('verifyOtp.error.generic'));
          return;
        }

        signIn(data.result);
        navigate(getPostLoginPath(data.result.role), { replace: true });
      } catch (err) {
        const axiosError = err as AxiosError<ApiResponse>;
        setError(
          axiosError.response?.data?.message || t('verifyOtp.error.generic'),
        );
      } finally {
        setLoading(false);
      }
    },
    [navigate, signIn],
  );

  const resendOtp = useCallback(async (email: string) => {
    setResending(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await sessionApi.resendOtp({ email });

      if (!data.isSuccess) {
        setError(data.message || t('verifyOtp.error.resendFailed'));
        return;
      }

      setSuccess(t('verifyOtp.resendSuccess'));
    } catch (err) {
      const axiosError = err as AxiosError<ApiResponse>;
      setError(
        axiosError.response?.data?.message || t('verifyOtp.error.resendFailed'),
      );
    } finally {
      setResending(false);
    }
  }, []);

  return { loading, error, success, resending, verifyOtp, resendOtp };
}
