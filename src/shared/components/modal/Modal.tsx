import React from 'react';

export interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  flush?: boolean;
}

export function Modal({ title, subtitle, onClose, children, maxWidth = 'max-w-2xl', flush = false }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 flex max-h-[88vh] w-full ${maxWidth} animate-scale-in flex-col rounded-[var(--radius-card-lg)] bg-card shadow-modal`}>
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-card-border px-7 py-5">
          <div className="min-w-0">
            <h2 className="heading-entity truncate">{title}</h2>
            {subtitle && <p className="field-hint truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div
          className={
            flush
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
              : 'min-h-0 flex-1 overflow-y-auto px-7 py-6'
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
