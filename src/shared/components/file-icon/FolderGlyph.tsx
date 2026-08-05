export interface FolderGlyphProps {
  open?: boolean;
  size?: number;
  className?: string;
}

export function FolderGlyph({ open = false, size = 16, className = '' }: FolderGlyphProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {open ? (
        <>
          <path d="M3 19V6a2 2 0 0 1 2-2h4.6a2 2 0 0 1 1.6.8L12.6 7H19a2 2 0 0 1 2 2v1.2" />
          <path d="M3 19l2.4-7.2A2 2 0 0 1 7.3 10.4h13.1a1.5 1.5 0 0 1 1.43 1.95L19.6 19a2 2 0 0 1-1.9 1.4H4.6A1.6 1.6 0 0 1 3 19z" />
        </>
      ) : (
        <path d="M3 19V6a2 2 0 0 1 2-2h4.6a2 2 0 0 1 1.6.8L12.6 7H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      )}
    </svg>
  );
}
