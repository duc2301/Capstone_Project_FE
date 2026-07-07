import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { fileItemApi } from '@/entities/file-item';
import { t } from '@/shared/lib/i18n';
import type { SurfaceBinding } from '../model/binding';
import { loadPdf, renderPage, type PdfDoc } from '../model/pdf';
import { MarkupSurface } from './MarkupSurface';

interface Props {
  fileItemId: string;
  page: number;
  zoom: number;
  binding: SurfaceBinding;
  onLoaded: (pageCount: number) => void;
  onError: (message: string) => void;
}

/** Render trang PDF ra canvas & gắn markup lên đúng trang đó */
export function PdfStage({ fileItemId, page, zoom, binding, onLoaded, onError }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const seqRef = useRef(0);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [ready, setReady] = useState(false);

  // Tải file PDF về (chỉ lấy 1 lần)
  useEffect(() => {
    let cancelled = false;
    let loaded: PdfDoc | null = null;
    (async () => {
      try {
        const res = await fileItemApi.getViewPdf(fileItemId);
        const document = await loadPdf(res.data);
        if (cancelled) {
          void document.destroy();
          return;
        }
        loaded = document;
        setDoc(document);
        onLoaded(document.numPages);
      } catch {
        if (!cancelled) onError(t('markup.error.load'));
      }
    })();
    return () => {
      cancelled = true;
      if (loaded) void loaded.destroy();
    };
  }, [fileItemId, onLoaded, onError]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const renderWidth = Math.max(320, (containerWidth - 32) * zoom);

  // Chạy render trang hiện tại
  useEffect(() => {
    if (!doc || containerWidth === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const seq = (seqRef.current += 1);
    setReady(false);
    chainRef.current = chainRef.current.then(async () => {
      if (seq !== seqRef.current) return;
      try {
        await renderPage(doc, page, canvas, renderWidth);
        if (seq === seqRef.current) setReady(true);
      } catch {
        /* Cũ rồi, bỏ qua */
      }
    });
  }, [doc, page, renderWidth, containerWidth]);

  return (
    <div ref={scrollRef} className="flex h-full w-full items-start justify-center overflow-auto p-4">
      <div className="relative shrink-0 bg-white shadow-card" style={{ width: renderWidth }}>
        <canvas ref={canvasRef} className="block" />
        {ready ? (
          <MarkupSurface pageNumber={page} {...binding} />
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-text-muted">
            {t('common.loading')}
          </div>
        )}
      </div>
    </div>
  );
}
