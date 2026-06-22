import type { AxiosError } from 'axios';
import { useCallback, useState } from 'react';

import { sessionApi } from '@/entities/session';
import type { ApiResponse } from '@/shared/api';

interface UseForgotPasswordReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  forgotPassword: (email: string) => Promise<void>;
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const forgotPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await sessionApi.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      const axiosError = err as AxiosError<ApiResponse>;
      setError(
        axiosError.response?.data?.message ||
          'Có lỗi xảy ra. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, forgotPassword };
}
