import { useState } from 'react';

const SIZE_CLASS = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-3xl',
} as const;

export type UserAvatarSize = keyof typeof SIZE_CLASS;

interface Props {
  userName: string;
  avatarUrl?: string | null;
  size?: UserAvatarSize;
  rounded?: 'xl' | 'full';
  className?: string;
}

function initialOf(userName: string): string {
  return userName.trim().charAt(0).toUpperCase() || '?';
}

export function UserAvatar({
  userName,
  avatarUrl,
  size = 'md',
  rounded = 'xl',
  className = '',
}: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const shape = rounded === 'full' ? 'rounded-full' : 'rounded-xl';
  const base = `${SIZE_CLASS[size]} ${shape} shrink-0 overflow-hidden ${className}`;

  if (avatarUrl && failedUrl !== avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={userName}
        onError={() => setFailedUrl(avatarUrl)}
        className={`${base} object-cover`}
      />
    );
  }

  return (
    <span
      className={`${base} flex items-center justify-center bg-primary-light font-heading font-bold text-primary`}
      aria-label={userName}
    >
      {initialOf(userName)}
    </span>
  );
}
