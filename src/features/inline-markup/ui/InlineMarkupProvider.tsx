import { useCallback, useMemo, useState, type ReactNode } from 'react';

import type { SurfaceBinding } from '../model/binding';
import { InlineMarkupContext, type InlineMarkupContextValue } from '../model/inlineMarkupContext';
import { DEFAULT_STYLE, type MarkupStyle, type ToolId } from '../model/tools';
import { useInlineMarkup } from '../model/useInlineMarkup';

interface Props {
  fileItemId: string;
  fileVersionId: string | null;
  fileName: string;
  url: string | null;
  contentType: string | null;
  /** Chỉ bật tính năng này nếu file đó có hỗ trợ vẽ vời (PDF, ảnh, docx...) */
  enabled: boolean;
  children: ReactNode;
}

/** Cục này ôm toàn bộ state của markup 2D để chia sẻ cho các component con */
export function InlineMarkupProvider({ fileItemId, fileVersionId, fileName, url, contentType, enabled, children }: Props) {
  const { notes, saving, loading, error, createNote, updateNote, deleteNote, resolveNote } = useInlineMarkup(
    fileItemId,
    fileVersionId,
    enabled,
  );

  const [tool, setTool] = useState<ToolId>('select');
  const [style, setStyle] = useState<MarkupStyle>(DEFAULT_STYLE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);

  const applyStyle = useCallback(
    (patch: Partial<MarkupStyle>) => {
      const next = { ...style, ...patch };
      setStyle(next);
      if (selectedId) updateNote(selectedId, { styleJson: JSON.stringify(next) });
    },
    [style, selectedId, updateNote],
  );

  const binding: SurfaceBinding = useMemo(
    () => ({
      notes,
      tool,
      style,
      selectedId,
      onSelectedIdChange: setSelectedId,
      onCreate: createNote,
      onUpdate: updateNote,
      onDelete: deleteNote,
      onToolReset: () => setTool('select'),
    }),
    [notes, tool, style, selectedId, createNote, updateNote, deleteNote],
  );

  const value: InlineMarkupContextValue = useMemo(
    () => ({
      fileItemId,
      url,
      contentType,
      fileName,
      isImage: (contentType ?? '').startsWith('image/'),
      notes,
      loading,
      saving,
      error,
      resolveNote,
      deleteNote,
      tool,
      setTool,
      style,
      applyStyle,
      selectedId,
      setSelectedId,
      page,
      setPage,
      pageCount,
      setPageCount,
      zoom,
      setZoom,
      loadError,
      setLoadError,
      binding,
    }),
    [
      fileItemId, url, contentType, fileName, notes, loading, saving, error, resolveNote, deleteNote,
      tool, style, applyStyle, selectedId, page, pageCount, zoom, loadError, binding,
    ],
  );

  return <InlineMarkupContext.Provider value={value}>{children}</InlineMarkupContext.Provider>;
}
