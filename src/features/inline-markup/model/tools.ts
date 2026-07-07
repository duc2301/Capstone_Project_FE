import type { MarkupType } from '@/entities/file-note';
import { MarkupType as MT } from '@/entities/file-note';

/** Map mấy cái nút trên thanh công cụ thành loại markup tương ứng */
export type ToolId =
  | 'select'
  | 'rectangle'
  | 'ellipse'
  | 'arrow'
  | 'polyline'
  | 'freehand'
  | 'text'
  | 'callout'
  | 'cloud';

export interface ToolDef {
  id: ToolId;
  markupType: MarkupType | null;
  labelKey: string;
}

export const INLINE_TOOLS: ToolDef[] = [
  { id: 'select', markupType: null, labelKey: 'markup.tool.select' },
  { id: 'rectangle', markupType: MT.Rectangle, labelKey: 'markup.tool.rectangle' },
  { id: 'ellipse', markupType: MT.Ellipse, labelKey: 'markup.tool.ellipse' },
  { id: 'arrow', markupType: MT.Arrow, labelKey: 'markup.tool.arrow' },
  { id: 'polyline', markupType: MT.Polyline, labelKey: 'markup.tool.polyline' },
  { id: 'freehand', markupType: MT.Freehand, labelKey: 'markup.tool.freehand' },
  { id: 'text', markupType: MT.Text, labelKey: 'markup.tool.text' },
  { id: 'callout', markupType: MT.Callout, labelKey: 'markup.tool.callout' },
  { id: 'cloud', markupType: MT.Cloud, labelKey: 'markup.tool.cloud' },
];

export interface MarkupStyle {
  color: string;
  strokeWidth: number;
  fontSize: number;
}

export const DEFAULT_STYLE: MarkupStyle = { color: '#BA1A1A', strokeWidth: 2, fontSize: 14 };

export const MARKUP_COLORS = ['#BA1A1A', '#1D4ED8', '#047857', '#B45309', '#7C3AED', '#111827'];
export const STROKE_WIDTHS = [1, 2, 3, 5];

export function parseStyle(json: string | null | undefined): MarkupStyle {
  if (!json) return DEFAULT_STYLE;
  try {
    const raw = JSON.parse(json) as Partial<MarkupStyle>;
    return {
      color: typeof raw.color === 'string' ? raw.color : DEFAULT_STYLE.color,
      strokeWidth: typeof raw.strokeWidth === 'number' ? raw.strokeWidth : DEFAULT_STYLE.strokeWidth,
      fontSize: typeof raw.fontSize === 'number' ? raw.fontSize : DEFAULT_STYLE.fontSize,
    };
  } catch {
    return DEFAULT_STYLE;
  }
}
