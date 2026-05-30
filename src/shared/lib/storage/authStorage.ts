import { STORAGE_KEYS } from '@/shared/config';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const authStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.refreshToken);
  },

  setTokens({ accessToken, refreshToken }: AuthTokens): void {
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  },

  getUser<T>(): T | null {
    const raw = localStorage.getItem(STORAGE_KEYS.currentUser);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setUser(user: unknown): void {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  },
};
