import type { PDFDocumentProxy } from 'pdfjs-dist';
import * as pdfjs from 'pdfjs-dist';
// Lấy link worker để pdf.js chạy ngầm, khỏi lag UI
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export type PdfDoc = PDFDocumentProxy;

/** Chuyển data thô thành document cho pdf.js đọc */
export async function loadPdf(data: ArrayBuffer): Promise<PdfDoc> {
  // Bắt buộc phải copy ra Uint8Array để tránh bị detach mất data
  return pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
}

export interface RenderedSize {
  cssWidth: number;
  cssHeight: number;
}

/** Render 1 trang ra canvas với bề rộng CSS cho trước (nét theo devicePixelRatio). Trả kích thước CSS thực. */
export async function renderPage(
  doc: PdfDoc,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  cssWidth: number,
): Promise<RenderedSize> {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const cssScale = cssWidth / base.width;
  const outputScale = window.devicePixelRatio || 1;
  const viewport = page.getViewport({ scale: cssScale * outputScale });

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const cssHeight = base.height * cssScale;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return { cssWidth, cssHeight };
}

/** Tỉ lệ w/h của 1 trang (để khoá aspect khung overlay trước khi render xong). */
export async function pageAspect(doc: PdfDoc, pageNumber: number): Promise<number> {
  const page = await doc.getPage(pageNumber);
  const v = page.getViewport({ scale: 1 });
  return v.width / v.height;
}
