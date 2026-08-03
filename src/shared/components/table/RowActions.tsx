import type { ButtonHTMLAttributes, ReactNode } from 'react';

const ICON_TONE = {
  primary: 'text-primary hover:bg-primary-light',
  danger: 'text-danger hover:bg-danger-light',
  neutral: 'text-text-muted hover:bg-content-bg hover:text-text',
} as const;

const PILL_TONE = {
  primary: 'bg-primary/10 text-primary hover:bg-primary/20',
  success: 'bg-success-light text-success hover:bg-success/20',
  danger: 'bg-danger-light text-danger hover:bg-danger/20',
  neutral: 'text-text-secondary hover:bg-content-bg hover:text-text',
} as const;

export type ActionIconTone = keyof typeof ICON_TONE;
export type ActionPillTone = keyof typeof PILL_TONE;

interface RowActionsProps {
  children: ReactNode;
  columns?: number;
}

export function RowActions({ children, columns }: RowActionsProps) {
  if (columns) {
    return (
      <div
        className="grid items-center justify-end gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, auto)` }}
      >
        {children}
      </div>
    );
  }

  return <div className="flex items-center justify-end gap-2">{children}</div>;
}

interface ActionIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  tone?: ActionIconTone;
}

export function ActionIconButton({
  label,
  icon,
  tone = 'neutral',
  className = '',
  ...rest
}: ActionIconButtonProps) {
  return (
    <button
      {...rest}
      type="button"
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-button)] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${ICON_TONE[tone]} ${className}`}
    >
      {icon}
    </button>
  );
}

interface ActionPillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  tone?: ActionPillTone;
}

export function ActionPillButton({
  children,
  tone = 'neutral',
  className = '',
  ...rest
}: ActionPillButtonProps) {
  return (
    <button
      {...rest}
      type="button"
      className={`whitespace-nowrap rounded-[var(--radius-button)] px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${PILL_TONE[tone]} ${className}`}
    >
      {children}
    </button>
  );
}
