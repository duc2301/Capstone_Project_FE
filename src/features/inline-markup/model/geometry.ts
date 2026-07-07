import type { MarkupType } from '@/entities/file-note';
import { MarkupType as MT } from '@/entities/file-note';

/** Toạ độ markup luôn CHUẨN HOÁ 0..1 theo hộp trang/ảnh hiện tại (khớp CoordinateJson của BE). */
export interface Pt {
  x: number;
  y: number;
}
export interface BoxCoord {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface ArrowCoord {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
export interface PointsCoord {
  points: Pt[];
}
export interface TextCoord {
  x: number;
  y: number;
}
export type Coord = BoxCoord | ArrowCoord | PointsCoord | TextCoord;

/** Các loại vẽ bằng "kéo hộp" (Rectangle/Ellipse/Callout/Cloud). */
export const BOX_TYPES: MarkupType[] = [MT.Rectangle, MT.Ellipse, MT.Callout, MT.Cloud];
/** Các loại vẽ bằng chuỗi điểm (Polyline/Freehand). */
export const POINTS_TYPES: MarkupType[] = [MT.Polyline, MT.Freehand];

export function isBoxType(type: MarkupType): boolean {
  return BOX_TYPES.includes(type);
}

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Vị trí con trỏ -> toạ độ 0..1 trong 1 phần tử (theo bounding rect). */
export function pointerToNorm(clientX: number, clientY: number, rect: DOMRect): Pt {
  return {
    x: clamp01((clientX - rect.left) / Math.max(1, rect.width)),
    y: clamp01((clientY - rect.top) / Math.max(1, rect.height)),
  };
}

/** Hộp từ 2 điểm kéo (chuẩn hoá min/max để không âm kích thước). */
export function boxFromDrag(a: Pt, b: Pt): BoxCoord {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) };
}

export function parseCoord(type: MarkupType, json: string | null | undefined): Coord | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    if (type === MT.Arrow) {
      return { x1: num(raw.x1), y1: num(raw.y1), x2: num(raw.x2), y2: num(raw.y2) };
    }
    if (type === MT.Text) {
      return { x: num(raw.x), y: num(raw.y) };
    }
    if (POINTS_TYPES.includes(type)) {
      const pts = Array.isArray(raw.points) ? (raw.points as Record<string, unknown>[]) : [];
      return { points: pts.map((p) => ({ x: num(p.x), y: num(p.y) })) };
    }
    return { x: num(raw.x), y: num(raw.y), w: num(raw.w), h: num(raw.h) };
  } catch {
    return null;
  }
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Hộp bao (bounding box 0..1) của 1 shape — dùng để hit-test & vẽ khung chọn. */
export function boundsOf(type: MarkupType, coord: Coord): BoxCoord {
  if (type === MT.Arrow) {
    const a = coord as ArrowCoord;
    return boxFromDrag({ x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 });
  }
  if (type === MT.Text) {
    const t = coord as TextCoord;
    return { x: t.x, y: t.y, w: 0, h: 0 };
  }
  if (POINTS_TYPES.includes(type)) {
    const pts = (coord as PointsCoord).points;
    if (pts.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }
  return coord as BoxCoord;
}

/** Có nằm trong/gần shape không (tolerance theo đơn vị 0..1). */
export function hitTest(type: MarkupType, coord: Coord, p: Pt, tol: number): boolean {
  if (type === MT.Arrow) {
    const a = coord as ArrowCoord;
    return distToSegment(p, { x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 }) <= tol;
  }
  if (POINTS_TYPES.includes(type)) {
    const pts = (coord as PointsCoord).points;
    for (let i = 1; i < pts.length; i += 1) {
      if (distToSegment(p, pts[i - 1], pts[i]) <= tol) return true;
    }
    return false;
  }
  const b = boundsOf(type, coord);
  return p.x >= b.x - tol && p.x <= b.x + b.w + tol && p.y >= b.y - tol && p.y <= b.y + b.h + tol;
}

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Dời shape theo (dx,dy) trong không gian 0..1, có kẹp biên. */
export function translateCoord(type: MarkupType, coord: Coord, dx: number, dy: number): Coord {
  if (type === MT.Arrow) {
    const a = coord as ArrowCoord;
    return { x1: clamp01(a.x1 + dx), y1: clamp01(a.y1 + dy), x2: clamp01(a.x2 + dx), y2: clamp01(a.y2 + dy) };
  }
  if (type === MT.Text) {
    const t = coord as TextCoord;
    return { x: clamp01(t.x + dx), y: clamp01(t.y + dy) };
  }
  if (POINTS_TYPES.includes(type)) {
    return { points: (coord as PointsCoord).points.map((p) => ({ x: clamp01(p.x + dx), y: clamp01(p.y + dy) })) };
  }
  const b = coord as BoxCoord;
  return { x: clamp01(b.x + dx), y: clamp01(b.y + dy), w: b.w, h: b.h };
}

/** 8 chốt resize cho hộp: n, s, e, w, ne, nw, se, sw. */
export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export const BOX_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/** Vị trí (0..1) của 1 chốt trên hộp. */
export function handlePoint(box: BoxCoord, h: ResizeHandle): Pt {
  const midX = box.x + box.w / 2;
  const midY = box.y + box.h / 2;
  const left = box.x;
  const right = box.x + box.w;
  const top = box.y;
  const bottom = box.y + box.h;
  switch (h) {
    case 'nw': return { x: left, y: top };
    case 'n': return { x: midX, y: top };
    case 'ne': return { x: right, y: top };
    case 'e': return { x: right, y: midY };
    case 'se': return { x: right, y: bottom };
    case 's': return { x: midX, y: bottom };
    case 'sw': return { x: left, y: bottom };
    case 'w': return { x: left, y: midY };
    default: return { x: midX, y: midY };
  }
}

/** Resize hộp khi kéo 1 chốt tới điểm p (0..1). Giữ kích thước tối thiểu. */
export function resizeBox(box: BoxCoord, h: ResizeHandle, p: Pt): BoxCoord {
  let left = box.x;
  let top = box.y;
  let right = box.x + box.w;
  let bottom = box.y + box.h;
  if (h.includes('w')) left = clamp01(p.x);
  if (h.includes('e')) right = clamp01(p.x);
  if (h.includes('n')) top = clamp01(p.y);
  if (h.includes('s')) bottom = clamp01(p.y);
  const MIN = 0.01;
  if (right - left < MIN) {
    if (h.includes('w')) left = right - MIN;
    else right = left + MIN;
  }
  if (bottom - top < MIN) {
    if (h.includes('n')) top = bottom - MIN;
    else bottom = top + MIN;
  }
  return { x: left, y: top, w: right - left, h: bottom - top };
}

/** Giảm mật độ điểm freehand để CoordinateJson không phình. */
export function simplifyPoints(points: Pt[], minDist = 0.004, max = 400): Pt[] {
  if (points.length <= 2) return points;
  const out: Pt[] = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const last = out[out.length - 1];
    if (Math.hypot(points[i].x - last.x, points[i].y - last.y) >= minDist) out.push(points[i]);
  }
  const end = points[points.length - 1];
  if (out[out.length - 1] !== end) out.push(end);
  return out.length > max ? out.filter((_, i) => i % Math.ceil(out.length / max) === 0) : out;
}
