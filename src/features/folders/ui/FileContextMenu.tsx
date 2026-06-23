import { useCallback } from 'react';

import { t } from '@/shared/lib/i18n';

interface FileContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDetail: () => void;
  onDownload: () => void;
  onVersions: () => void;
  onSoon: () => void;
  canSubmitApproval: boolean;
  onSubmitApproval: () => void;
}

interface Item {
  key: string;
  label: string;
  onClick: () => void;
  soon?: boolean;
  icon: React.ReactNode;
}

export function FileContextMenu({
  x, y, onClose, onDetail, onDownload, onVersions, onSoon, canSubmitApproval, onSubmitApproval,
}: FileContextMenuProps) {
  // Giữ menu trong viewport: đo kích thước thật rồi lật vào trong nếu tràn phải/dưới.
  const clampRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const pad = 8;
    const { width, height } = el.getBoundingClientRect();
    el.style.left = `${Math.max(pad, Math.min(x, window.innerWidth - width - pad))}px`;
    el.style.top = `${Math.max(pad, Math.min(y, window.innerHeight - height - pad))}px`;
  }, [x, y]);

  const items: Item[] = [
    {
      key: 'detail', label: t('documents.fileMenu.detail'), onClick: onDetail,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    },
    {
      key: 'download', label: t('documents.fileMenu.download'), onClick: onDownload,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    },
    {
      key: 'versions', label: t('documents.fileMenu.versions'), onClick: onVersions,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>,
    },
    ...(canSubmitApproval ? [{
      key: 'submitApproval', label: t('documents.fileMenu.submitApproval'), onClick: onSubmitApproval,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>,
    }] : []),
    {
      key: 'permission', label: t('documents.fileMenu.permission'), soon: true, onClick: onSoon,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
    },
    {
      key: 'transition', label: t('documents.fileMenu.transition'), soon: true, onClick: onSoon,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>,
    },
    {
      key: 'discuss', label: t('documents.fileMenu.discuss'), soon: true, onClick: onSoon,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    },
    {
      key: 'share', label: t('documents.fileMenu.share'), soon: true, onClick: onSoon,
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>,
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div ref={clampRef} className="fixed z-50 min-w-52 animate-scale-in rounded-xl border border-card-border bg-card py-1.5 shadow-dropdown" style={{ top: y, left: x }}>
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={() => { it.onClick(); onClose(); }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-content-bg hover:text-text"
          >
            {it.icon}
            <span className="flex-1">{it.label}</span>
            {it.soon && <span className="text-[10px] text-text-placeholder">•••</span>}
          </button>
        ))}
      </div>
    </>
  );
}
