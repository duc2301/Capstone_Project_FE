import type { ButtonHTMLAttributes, ReactNode } from 'react';

const VARIANT = {
  outline: 'border border-primary text-primary hover:bg-primary-ghost',
  solid: 'bg-primary text-white hover:bg-primary-hover',
  ghost: 'border border-card-border bg-card text-text hover:bg-content-bg',
  danger: 'border border-danger text-danger hover:bg-danger-light',
} as const;

const SIZE = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
} as const;

export type ToolbarIconVariant = keyof typeof VARIANT;
export type ToolbarIconSize = keyof typeof SIZE;

interface ToolbarIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  variant?: ToolbarIconVariant;
  size?: ToolbarIconSize;
}

export function ToolbarIconButton({
  label,
  icon,
  variant = 'outline',
  size = 'md',
  className = '',
  ...rest
}: ToolbarIconButtonProps) {
  return (
    <button
      {...rest}
      type="button"
      title={label}
      aria-label={label}
      className={`flex shrink-0 items-center justify-center rounded-[var(--radius-button)] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${SIZE[size]} ${VARIANT[variant]} ${className}`}
    >
      {icon}
    </button>
  );
}
