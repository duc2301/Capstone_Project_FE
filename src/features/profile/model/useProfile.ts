import { useCallback, useEffect, useState } from 'react';

import type { ChangePasswordPayload, Profile, UpdateProfilePayload } from '@/entities/profile';
import { profileApi } from '@/entities/profile';
import { t } from '@/shared/lib/i18n';

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await profileApi.get();
      setProfile(data.result ?? null);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const { data } = await profileApi.update(payload);
    if (data.result) setProfile(data.result);
  }, []);

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    await profileApi.changePassword(payload);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await profileApi.get();
        if (!cancelled) setProfile(data.result ?? null);
      } catch {
        if (!cancelled) setError(t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, loading, error, fetchProfile, updateProfile, changePassword };
}
