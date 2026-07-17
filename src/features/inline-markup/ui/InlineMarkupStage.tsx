import { useRef } from 'react';

import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';
import { useInlineMarkupContext } from '../model/inlineMarkupContext';
import { INLINE_TOOLS, MARKUP_COLORS, STROKE_WIDTHS, type ToolId } from '../model/tools';
import { useFullscreen } from '../model/useFullscreen';
import { ImageStage } from './ImageStage';
import { PdfStage } from './PdfStage';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

interface InlineMarkupStageProps {
  onExitMarkup?: () => void;
}

export function InlineMarkupStage({ onExitMarkup }: InlineMarkupStageProps) {
  const c = useInlineMarkupContext();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { isFullscreen, toggle } = useFullscreen(rootRef);

  return (
    <div ref={rootRef} className="absolute inset-0 flex flex-col bg-[#dcdad2]">
      <div className="z-20 flex flex-wrap items-center gap-2 border-b border-white/60 bg-card/85 px-3 py-2 shadow-sm backdrop-blur">
        <div className="flex items-center gap-1">
          {INLINE_TOOLS.map((td) => (
            <ToolButton
              key={td.id}
              active={c.tool === td.id}
              label={t(td.labelKey as TranslationKey)}
              onClick={() => c.setTool(td.id)}
            >
              <ToolGlyph id={td.id} />
            </ToolButton>
          ))}
        </div>

        <span className="mx-1 h-5 w-px bg-card-border" />

        <div className="flex items-center gap-1" title={t('markup.inline.color')}>
          {MARKUP_COLORS.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => c.applyStyle({ color: col })}
              aria-label={col}
              className={`h-5 w-5 rounded-full border-2 ${c.style.color === col ? 'border-text' : 'border-white'} shadow`}
              style={{ backgroundColor: col }}
            />
          ))}
        </div>

        <div className="flex items-center gap-1" title={t('markup.inline.width')}>
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => c.applyStyle({ strokeWidth: w })}
              className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${c.style.strokeWidth === w ? 'bg-primary/15' : 'hover:bg-content-bg'}`}
            >
              <span className="rounded-full bg-text" style={{ width: w + 2, height: w + 2 }} />
            </button>
          ))}
        </div>

        {!c.isImage && c.pageCount > 1 && (
          <>
            <span className="mx-1 h-5 w-px bg-card-border" />
            <div className="flex items-center gap-1.5 rounded-lg border border-card-border bg-content-bg/60 px-2 py-1">
              <PagerButton disabled={c.page <= 1} onClick={() => c.setPage((p) => Math.max(1, p - 1))} label={t('markup.inline.prevPage')} dir="prev" />
              <span className="min-w-16 text-center text-xs font-semibold text-text">
                {t('markup.inline.page')} {c.page}/{c.pageCount}
              </span>
              <PagerButton disabled={c.page >= c.pageCount} onClick={() => c.setPage((p) => Math.min(c.pageCount, p + 1))} label={t('markup.inline.nextPage')} dir="next" />
            </div>
          </>
        )}

        <span className="mx-1 h-5 w-px bg-card-border" />
        <div className="flex items-center gap-1">
          <IconBtn onClick={() => c.setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))} label={t('markup.inline.zoomOut')}>−</IconBtn>
          <button type="button" onClick={() => c.setZoom(1)} className="min-w-12 rounded-md px-1 text-xs font-semibold text-text hover:bg-content-bg" title={t('markup.inline.zoomReset')}>
            {Math.round(c.zoom * 100)}%
          </button>
          <IconBtn onClick={() => c.setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))} label={t('markup.inline.zoomIn')}>+</IconBtn>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {c.saving && <span className="text-xs font-medium text-text-muted">{t('markup.inline.saving')}</span>}
          {onExitMarkup && (
            <button
              type="button"
              onClick={onExitMarkup}
              title={t('markup.inline.exit')}
              className="flex h-7 items-center gap-1.5 rounded-full border border-card-border px-3 text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
              </svg>
              {t('markup.inline.exit')}
            </button>
          )}
          <button
            type="button"
            onClick={toggle}
            title={isFullscreen ? t('markup.inline.exitFullscreen') : t('markup.inline.fullscreen')}
            aria-label={isFullscreen ? t('markup.inline.exitFullscreen') : t('markup.inline.fullscreen')}
            className="flex h-7 items-center gap-1.5 rounded-full border border-card-border px-3 text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg"
          >
            <FullscreenGlyph exit={isFullscreen} />
            {isFullscreen ? t('markup.inline.exitFullscreen') : t('markup.inline.fullscreen')}
          </button>
        </div>
      </div>

      <p className="bg-card/60 px-3 py-1 text-[11px] text-text-muted">
        {c.tool === 'polyline' ? t('markup.inline.polylineHint') : t('markup.inline.hint')}
      </p>

      <div className="relative min-h-0 flex-1">
        {c.loadError ? (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <p className="text-sm font-medium text-danger">{c.loadError}</p>
          </div>
        ) : !c.url ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-text-muted">{t('common.loading')}</div>
        ) : c.isImage ? (
          <ImageStage url={c.url} alt={c.fileName} zoom={c.zoom} binding={c.binding} />
        ) : (
          <PdfStage
            fileItemId={c.fileItemId}
            page={c.page}
            zoom={c.zoom}
            binding={c.binding}
            onLoaded={c.setPageCount}
            onError={c.setLoadError}
          />
        )}
      </div>
    </div>
  );
}

function ToolButton({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${active ? 'bg-primary text-white' : 'text-text-secondary hover:bg-content-bg'}`}
    >
      {children}
    </button>
  );
}

function IconBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className="flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold text-text-secondary transition-colors hover:bg-content-bg">
      {children}
    </button>
  );
}

function PagerButton({ disabled, onClick, label, dir }: { disabled: boolean; onClick: () => void; label: string; dir: 'prev' | 'next' }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="flex h-6 w-6 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points={dir === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
      </svg>
    </button>
  );
}

function FullscreenGlyph({ exit }: { exit: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {exit ? <path d="M9 3v6H3M21 9h-6V3M3 15h6v6M15 21v-6h6" /> : <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />}
    </svg>
  );
}

function ToolGlyph({ id }: { id: ToolId }) {
  const p = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'select':
      return <svg {...p}><path d="m3 3 7 18 2.5-7.5L20 11 3 3Z" /></svg>;
    case 'rectangle':
      return <svg {...p}><rect x="4" y="6" width="16" height="12" rx="1" /></svg>;
    case 'ellipse':
      return <svg {...p}><ellipse cx="12" cy="12" rx="8" ry="6" /></svg>;
    case 'arrow':
      return <svg {...p}><path d="M5 19 19 5M11 5h8v8" /></svg>;
    case 'polyline':
      return <svg {...p}><path d="M3 17l5-7 4 4 5-8" /></svg>;
    case 'freehand':
      return <svg {...p}><path d="M4 18c3-6 5 2 8-2s2-8 8-6" /></svg>;
    case 'text':
      return <svg {...p}><path d="M6 5h12M12 5v14" /></svg>;
    case 'callout':
      return <svg {...p}><path d="M4 5h16v10H10l-4 4v-4H4Z" /></svg>;
    case 'cloud':
      return <svg {...p}><path d="M7 16a3 3 0 0 1-.3-6A4 4 0 0 1 14 8a3.5 3.5 0 0 1 3 6H7Z" /></svg>;
    default:
      return null;
  }
}
