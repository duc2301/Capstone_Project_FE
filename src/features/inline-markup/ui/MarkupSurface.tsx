import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

import type { CreateFileNotePayload, FileNote, MarkupType, UpdateFileNotePayload } from '@/entities/file-note';
import { MarkupType as MT } from '@/entities/file-note';
import {
  boundsOf,
  BOX_HANDLES,
  boxFromDrag,
  handlePoint,
  hitTest,
  isBoxType,
  parseCoord,
  pointerToNorm,
  resizeBox,
  simplifyPoints,
  translateCoord,
  type ArrowCoord,
  type BoxCoord,
  type Coord,
  type PointsCoord,
  type Pt,
  type ResizeHandle,
  type TextCoord,
} from '../model/geometry';
import { parseStyle, type MarkupStyle, type ToolId } from '../model/tools';

interface Size {
  w: number;
  h: number;
}

interface Props {
  pageNumber: number | null;
  notes: FileNote[];
  tool: ToolId;
  style: MarkupStyle;
  readOnly?: boolean;
  selectedId: string | null;
  onSelectedIdChange: (id: string | null) => void;
  onCreate: (payload: CreateFileNotePayload) => Promise<FileNote | null>;
  onUpdate: (noteId: string, payload: UpdateFileNotePayload) => void;
  onDelete: (noteId: string) => void;
  /** Vẽ xong thì tự động quay về công cụ trỏ chuột (select) */
  onToolReset: () => void;
}

type Draft = { type: MarkupType; coord: Coord } | null;

type DragRef =
  | { mode: 'create'; type: MarkupType; start: Pt }
  | { mode: 'free'; type: MarkupType }
  | { mode: 'move'; noteId: string; type: MarkupType; start: Pt; orig: Coord }
  | { mode: 'resize'; noteId: string; type: MarkupType; handle: ResizeHandle | 'a1' | 'a2'; orig: Coord }
  | null;

const TOOL_TYPE: Record<Exclude<ToolId, 'select'>, MarkupType> = {
  rectangle: MT.Rectangle,
  ellipse: MT.Ellipse,
  arrow: MT.Arrow,
  polyline: MT.Polyline,
  freehand: MT.Freehand,
  text: MT.Text,
  callout: MT.Callout,
  cloud: MT.Cloud,
};

const HIT_TOL = 0.012;

export function MarkupSurface({
  pageNumber,
  notes,
  tool,
  style,
  readOnly = false,
  selectedId,
  onSelectedIdChange,
  onCreate,
  onUpdate,
  onDelete,
  onToolReset,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const [draft, setDraft] = useState<Draft>(null);
  const [live, setLive] = useState<{ id: string; coord: Coord } | null>(null);
  const [poly, setPoly] = useState<Pt[] | null>(null);
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const dragRef = useRef<DragRef>(null);

  const pageNotes = notes.filter((n) => (n.pageNumber ?? null) === pageNumber);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const norm = useCallback((e: { clientX: number; clientY: number }): Pt => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return pointerToNorm(e.clientX, e.clientY, rect);
  }, []);

  const commitCreate = useCallback(
    async (type: MarkupType, coord: Coord, content?: string): Promise<FileNote | null> => {
      return onCreate({
        markupType: type,
        pageNumber,
        coordinateJson: JSON.stringify(coord),
        styleJson: JSON.stringify(style),
        content: content ?? null,
      });
    },
    [onCreate, pageNumber, style],
  );

  const startTextAt = useCallback(
    async (p: Pt) => {
      const created = await commitCreate(MT.Text, { x: p.x, y: p.y } as TextCoord, '');
      if (created) {
        onSelectedIdChange(created.id);
        setEditing({ id: created.id, value: '' });
      }
      onToolReset();
    },
    [commitCreate, onSelectedIdChange, onToolReset],
  );

  const finishPolyline = useCallback(
    async (pts: Pt[]) => {
      setPoly(null);
      if (pts.length >= 2) await commitCreate(MT.Polyline, { points: pts } as PointsCoord);
      onToolReset();
    },
    [commitCreate, onToolReset],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (readOnly || editing) return;
      if (e.button !== 0) return;
      const p = norm(e);
      rootRef.current?.setPointerCapture(e.pointerId);

      if (tool === 'select') {
        const hit = [...pageNotes].reverse().find((n) => {
          const c = parseCoord(n.markupType, n.coordinateJson);
          return c && hitTest(n.markupType, c, p, HIT_TOL);
        });
        if (hit) {
          onSelectedIdChange(hit.id);
          const orig = parseCoord(hit.markupType, hit.coordinateJson);
          if (orig) dragRef.current = { mode: 'move', noteId: hit.id, type: hit.markupType, start: p, orig };
        } else {
          onSelectedIdChange(null);
        }
        return;
      }

      const type = TOOL_TYPE[tool];
      if (type === MT.Text) {
        void startTextAt(p);
        return;
      }
      if (type === MT.Polyline) {
        setPoly((prev) => [...(prev ?? []), p]);
        return;
      }
      if (type === MT.Freehand) {
        dragRef.current = { mode: 'free', type };
        setDraft({ type, coord: { points: [p] } as PointsCoord });
        return;
      }
      // Kéo chuột để vẽ hình khối, mũi tên
      dragRef.current = { mode: 'create', type, start: p };
      setDraft({
        type,
        coord: type === MT.Arrow ? ({ x1: p.x, y1: p.y, x2: p.x, y2: p.y } as ArrowCoord) : ({ x: p.x, y: p.y, w: 0, h: 0 } as BoxCoord),
      });
    },
    [readOnly, editing, norm, tool, pageNotes, onSelectedIdChange, startTextAt],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d) return;
      const p = norm(e);

      if (d.mode === 'create') {
        setDraft({
          type: d.type,
          coord: d.type === MT.Arrow ? ({ x1: d.start.x, y1: d.start.y, x2: p.x, y2: p.y } as ArrowCoord) : boxFromDrag(d.start, p),
        });
      } else if (d.mode === 'free') {
        setDraft((prev) => {
          const pts = prev ? (prev.coord as PointsCoord).points : [];
          return { type: d.type, coord: { points: [...pts, p] } as PointsCoord };
        });
      } else if (d.mode === 'move') {
        setLive({ id: d.noteId, coord: translateCoord(d.type, d.orig, p.x - d.start.x, p.y - d.start.y) });
      } else if (d.mode === 'resize') {
        setLive({ id: d.noteId, coord: applyResize(d.type, d.orig, d.handle, p) });
      }
    },
    [norm],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      dragRef.current = null;
      if (!d) return;
      rootRef.current?.releasePointerCapture(e.pointerId);

      if (d.mode === 'create' && draft) {
        const b = boundsOf(draft.type, draft.coord);
        if (b.w >= 0.008 || b.h >= 0.008) void commitCreate(draft.type, draft.coord);
        setDraft(null);
      } else if (d.mode === 'free' && draft) {
        const pts = simplifyPoints((draft.coord as PointsCoord).points);
        if (pts.length >= 2) void commitCreate(MT.Freehand, { points: pts } as PointsCoord);
        setDraft(null);
      } else if ((d.mode === 'move' || d.mode === 'resize') && live) {
        onUpdate(d.noteId, { coordinateJson: JSON.stringify(live.coord) });
        setLive(null);
      }
    },
    [draft, live, commitCreate, onUpdate],
  );

  const startResize = useCallback(
    (e: ReactPointerEvent, note: FileNote, handle: ResizeHandle | 'a1' | 'a2') => {
      e.stopPropagation();
      if (readOnly) return;
      const orig = parseCoord(note.markupType, note.coordinateJson);
      if (!orig) return;
      rootRef.current?.setPointerCapture(e.pointerId);
      dragRef.current = { mode: 'resize', noteId: note.id, type: note.markupType, handle, orig };
    },
    [readOnly],
  );

  // Bấm Esc để huỷ, Delete để xoá nha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing) return;
      if (e.key === 'Escape') {
        if (poly) void finishPolyline(poly);
        else onSelectedIdChange(null);
        setDraft(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        onDelete(selectedId);
        onSelectedIdChange(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, poly, selectedId, finishPolyline, onDelete, onSelectedIdChange]);

  const coordOf = (n: FileNote): Coord | null =>
    live?.id === n.id ? live.coord : parseCoord(n.markupType, n.coordinateJson);

  const cursor = readOnly ? 'default' : tool === 'select' ? 'default' : 'crosshair';

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 touch-none select-none"
      style={{ cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => {
        if (poly) void finishPolyline(poly);
      }}
    >
      <svg width={size.w} height={size.h} className="absolute inset-0 overflow-visible">
        {pageNotes.map((n) => {
          const c = coordOf(n);
          if (!c) return null;
          return (
            <Shape
              key={n.id}
              type={n.markupType}
              coord={c}
              style={parseStyle(n.styleJson)}
              size={size}
              resolved={n.status === 1}
              selected={n.id === selectedId}
            />
          );
        })}
        {draft && <Shape type={draft.type} coord={draft.coord} style={style} size={size} resolved={false} selected preview />}
        {poly && poly.length > 0 && (
          <polyline
            points={poly.map((p) => `${p.x * size.w},${p.y * size.h}`).join(' ')}
            fill="none"
            stroke={style.color}
            strokeWidth={style.strokeWidth}
            strokeDasharray="4 3"
          />
        )}
      </svg>

      {/* Hiển thị nội dung chữ (dùng HTML cho dễ gõ tiếng Việt) */}
      {pageNotes.map((n) => {
        if (n.markupType !== MT.Text && n.markupType !== MT.Callout) return null;
        const c = coordOf(n);
        if (!c) return null;
        const st = parseStyle(n.styleJson);
        const isBox = n.markupType === MT.Callout;
        const box = isBox ? (c as BoxCoord) : null;
        const pt = isBox ? { x: box!.x, y: box!.y } : (c as TextCoord);
        const isEditing = editing?.id === n.id;
        return (
          <div
            key={`t-${n.id}`}
            className="absolute"
            style={{
              left: `${pt.x * 100}%`,
              top: `${pt.y * 100}%`,
              width: isBox ? `${box!.w * 100}%` : 'auto',
              maxWidth: isBox ? undefined : '40%',
              color: st.color,
              fontSize: st.fontSize,
              padding: isBox ? 4 : 0,
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!readOnly) setEditing({ id: n.id, value: n.content ?? '' });
            }}
          >
            {isEditing ? (
              <textarea
                autoFocus
                value={editing.value}
                onChange={(e) => setEditing({ id: n.id, value: e.target.value })}
                onBlur={() => {
                  onUpdate(n.id, { content: editing.value });
                  setEditing(null);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-full resize-none rounded border border-primary bg-white/95 px-1 py-0.5 text-text shadow-sm focus:outline-none"
                style={{ fontSize: st.fontSize }}
                rows={2}
              />
            ) : (
              <span className="whitespace-pre-wrap break-words drop-shadow-sm">
                {n.content || (n.markupType === MT.Text ? '…' : '')}
              </span>
            )}
          </div>
        );
      })}

      {/* Mấy cái cục vuông nhỏ để kéo thả kích thước */}
      {!readOnly && selectedId && renderHandles()}
    </div>
  );

  function renderHandles() {
    const n = pageNotes.find((x) => x.id === selectedId);
    if (!n) return null;
    const c = coordOf(n);
    if (!c) return null;

    if (n.markupType === MT.Arrow) {
      const a = c as ArrowCoord;
      return (
        <>
          <Handle x={a.x1} y={a.y1} size={size} onDown={(e) => startResize(e, n, 'a1')} />
          <Handle x={a.x2} y={a.y2} size={size} onDown={(e) => startResize(e, n, 'a2')} />
        </>
      );
    }
    if (isBoxType(n.markupType)) {
      const b = c as BoxCoord;
      return (
        <>
          {BOX_HANDLES.map((h) => {
            const hp = handlePoint(b, h);
            return <Handle key={h} x={hp.x} y={hp.y} size={size} onDown={(e) => startResize(e, n, h)} />;
          })}
        </>
      );
    }
    return null;
  }
}

function applyResize(type: MarkupType, orig: Coord, handle: ResizeHandle | 'a1' | 'a2', p: Pt): Coord {
  if (type === MT.Arrow) {
    const a = orig as ArrowCoord;
    return handle === 'a1' ? { ...a, x1: p.x, y1: p.y } : { ...a, x2: p.x, y2: p.y };
  }
  return resizeBox(orig as BoxCoord, handle as ResizeHandle, p);
}

function Handle({ x, y, size, onDown }: { x: number; y: number; size: Size; onDown: (e: ReactPointerEvent) => void }) {
  return (
    <div
      onPointerDown={onDown}
      className="absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white bg-primary shadow"
      style={{ left: x * size.w, top: y * size.h, cursor: 'pointer' }}
    />
  );
}

interface ShapeProps {
  type: MarkupType;
  coord: Coord;
  style: MarkupStyle;
  size: Size;
  resolved: boolean;
  selected: boolean;
  preview?: boolean;
}

function Shape({ type, coord, style, size, resolved, selected, preview = false }: ShapeProps) {
  const stroke = style.color;
  const sw = style.strokeWidth;
  const opacity = resolved ? 0.45 : 1;
  const common = { stroke, strokeWidth: sw, fill: 'none', opacity, strokeDasharray: preview ? '5 4' : undefined };
  const X = (v: number) => v * size.w;
  const Y = (v: number) => v * size.h;

  const halo = selected ? <SelectionOutline type={type} coord={coord} size={size} /> : null;

  if (type === MT.Arrow) {
    const a = coord as ArrowCoord;
    return (
      <g>
        <line x1={X(a.x1)} y1={Y(a.y1)} x2={X(a.x2)} y2={Y(a.y2)} strokeLinecap="round" {...common} />
        <polygon points={arrowHead(X(a.x1), Y(a.y1), X(a.x2), Y(a.y2), sw)} fill={stroke} opacity={opacity} />
        {halo}
      </g>
    );
  }
  if (type === MT.Ellipse) {
    const b = coord as BoxCoord;
    return (
      <g>
        <ellipse cx={X(b.x + b.w / 2)} cy={Y(b.y + b.h / 2)} rx={(b.w * size.w) / 2} ry={(b.h * size.h) / 2} {...common} />
        {halo}
      </g>
    );
  }
  if (type === MT.Cloud) {
    const b = coord as BoxCoord;
    return (
      <g>
        <path d={cloudPath(X(b.x), Y(b.y), b.w * size.w, b.h * size.h)} strokeLinejoin="round" {...common} />
        {halo}
      </g>
    );
  }
  if (type === MT.Polyline || type === MT.Freehand) {
    const pts = (coord as PointsCoord).points.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ');
    return (
      <g>
        <polyline points={pts} strokeLinecap="round" strokeLinejoin="round" {...common} />
        {halo}
      </g>
    );
  }
  if (type === MT.Text) {
    // Khung chữ thì dùng HTML hiển thị, chỉ vẽ thêm điểm neo lúc đang chọn thôi
    return halo;
  }
  // Nhóm hình chữ nhật, callout
  const b = coord as BoxCoord;
  return (
    <g>
      <rect
        x={X(b.x)}
        y={Y(b.y)}
        width={b.w * size.w}
        height={b.h * size.h}
        rx={type === MT.Callout ? 6 : 0}
        {...common}
        fill={type === MT.Callout ? 'rgba(255,255,255,0.55)' : 'none'}
      />
      {halo}
    </g>
  );
}

function SelectionOutline({ type, coord, size }: { type: MarkupType; coord: Coord; size: Size }) {
  const b = boundsOf(type, coord);
  const pad = 4;
  return (
    <rect
      x={b.x * size.w - pad}
      y={b.y * size.h - pad}
      width={b.w * size.w + pad * 2}
      height={b.h * size.h + pad * 2}
      fill="none"
      stroke="#2563EB"
      strokeWidth={1}
      strokeDasharray="4 3"
    />
  );
}

function arrowHead(x1: number, y1: number, x2: number, y2: number, sw: number): string {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const len = 8 + sw * 2.2;
  const spread = Math.PI / 7;
  const bx1 = x2 - len * Math.cos(ang - spread);
  const by1 = y2 - len * Math.sin(ang - spread);
  const bx2 = x2 - len * Math.cos(ang + spread);
  const by2 = y2 - len * Math.sin(ang + spread);
  return `${x2},${y2} ${bx1},${by1} ${bx2},${by2}`;
}

function cloudPath(x: number, y: number, w: number, h: number): string {
  const r = Math.max(6, Math.min(w, h) / 8);
  const pts: [number, number][] = [];
  const edge = (x1: number, y1: number, x2: number, y2: number) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.round(len / (r * 2)));
    for (let i = 0; i < n; i += 1) pts.push([x1 + (x2 - x1) * (i / n), y1 + (y2 - y1) * (i / n)]);
  };
  edge(x, y, x + w, y);
  edge(x + w, y, x + w, y + h);
  edge(x + w, y + h, x, y + h);
  edge(x, y + h, x, y);
  if (pts.length === 0) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]} `;
  for (let i = 1; i <= pts.length; i += 1) {
    const p = pts[i % pts.length];
    d += `A ${r} ${r} 0 0 1 ${p[0]} ${p[1]} `;
  }
  return `${d}Z`;
}
