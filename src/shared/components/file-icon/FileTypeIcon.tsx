import { fileKindColor, fileKindLabel, fileKindOf } from './fileKind';

export type FileIconSize = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<FileIconSize, number> = { sm: 26, md: 34, lg: 46 };

export interface FileTypeIconProps {
  fileName: string;
  format?: string | null;
  size?: FileIconSize;
  className?: string;
}

export function FileTypeIcon({ fileName, format, size = 'md', className = '' }: FileTypeIconProps) {
  const kind = fileKindOf(fileName, format);
  const label = fileKindLabel(kind);
  const color = fileKindColor(kind);
  const px = SIZE_PX[size];

  return (
    <svg
      width={px}
      height={px * 1.16}
      viewBox="0 0 32 38"
      fill="none"
      role="img"
      aria-label={label}
      className={`shrink-0 ${className}`}
    >
      <path
        d="M7 1h12.6L28 9.4V33a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V5a4 4 0 0 1 3-4z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M19.6 1v5.4a3 3 0 0 0 3 3H28" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <text
        x="16"
        y="29"
        textAnchor="middle"
        fill={color}
        fontSize={label.length >= 4 ? 8 : 9.5}
        fontWeight="700"
        fontFamily="var(--font-heading)"
        letterSpacing="0.2"
      >
        {label}
      </text>
    </svg>
  );
}
