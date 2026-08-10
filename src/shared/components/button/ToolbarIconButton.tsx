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

const SIZE_WITH_LABEL = {
  xs: 'h-6 gap-1.5 px-2.5 text-xs',
  sm: 'h-8 gap-1.5 px-3.5 text-xs',
  md: 'h-10 gap-2 px-5 text-sm',
} as const;

export type ToolbarIconVariant = keyof typeof VARIANT;
export type ToolbarIconSize = keyof typeof SIZE;

interface ToolbarIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  variant?: ToolbarIconVariant;
  size?: ToolbarIconSize;
  showLabel?: boolean;
}

export function ToolbarIconButton({
  label,
  icon,
  variant = 'outline',
  size = 'md',
  showLabel = false,
  className = '',
  ...rest
}: ToolbarIconButtonProps) {
  return (
    <button
      {...rest}
      type="button"
      title={showLabel ? undefined : label}
      aria-label={showLabel ? undefined : label}
      className={`flex shrink-0 items-center justify-center rounded-[var(--radius-button)] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${showLabel ? SIZE_WITH_LABEL[size] : SIZE[size]} ${VARIANT[variant]} ${className}`}
    >
      {icon}
      {showLabel && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}
