import type { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { sessionApi } from '@/entities/session';
import type { ApiResponse } from '@/shared/api';

interface UseResetPasswordReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<void>;
}

export function useResetPassword(): UseResetPasswordReturn {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetPassword = useCallback(
    async (email: string, token: string, newPassword: string) => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        await sessionApi.resetPassword(email, token, newPassword);
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2500);
      } catch (err) {
        const axiosError = err as AxiosError<ApiResponse>;
        setError(
          axiosError.response?.data?.message ||
            'Token không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.',
        );
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  return { loading, error, success, resetPassword };
}
