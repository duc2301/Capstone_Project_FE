import type { AxiosError } from 'axios';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { RegisterPayload } from '@/entities/session';
import { getPostLoginPath, sessionApi, useSession } from '@/entities/session';
import type { ApiResponse } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

interface UseRegisterReturn {
  loading: boolean;
  error: string | null;
  register: (payload: RegisterPayload) => Promise<void>;
}

export function useRegister(): UseRegisterReturn {
  const navigate = useNavigate();
  const { signIn } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(
    async (payload: RegisterPayload) => {
      if (payload.password !== payload.confirmPassword) {
        setError(t('register.error.passwordMismatch'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data } = await sessionApi.register(payload);

        if (!data.isSuccess || !data.result) {
          setError(data.message || t('register.error.generic'));
          return;
        }

        if (!data.result.accessToken) {
          // Gửi email thành công nhưng cần xác thực OTP
          navigate(`/verify-otp?email=${encodeURIComponent(payload.email)}`, { replace: true });
          return;
        }

        signIn(data.result);
        navigate(getPostLoginPath(data.result.role), { replace: true });
      } catch (err) {
        const axiosError = err as AxiosError<ApiResponse>;
        const errorMessage = axiosError.response?.data?.message || t('register.error.generic');
        
        // Nếu email đã tồn tại nhưng chưa xác thực, tự động chuyển sang trang xác thực
        if (axiosError.response?.status === 409 && errorMessage.includes('chưa xác thực')) {
          navigate(`/verify-otp?email=${encodeURIComponent(payload.email)}`);
          return;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [navigate, signIn],
  );

  return { loading, error, register };
}
