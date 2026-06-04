export enum AccountRole {
  Admin = 'Admin',
  User = 'User',
}

export interface CurrentUser {
  accountId: string;
  userName: string;
  email: string;
  role: AccountRole | number;
}

export interface AuthResult extends CurrentUser {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

export type LogoutPayload = RefreshPayload;
