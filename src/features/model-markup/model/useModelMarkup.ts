import { useCallback, useState } from 'react';

import type { FileNote, MarkupSet } from '@/entities/file-note';
import {
  FileNoteStatus,
  markupApi,
  MarkupSetStatus,
  MarkupType,
  useFileNoteRealtime,
} from '@/entities/file-note';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';
import { captureMarkupSvg, captureThumbnail, captureViewpoint, endDraw } from './apsMarkup';

type Viewer = Autodesk.Viewing.GuiViewer3D;

interface MarkupData {
  set: MarkupSet | null;
  notes: FileNote[];
}

const EMPTY_MARKUP_DATA: MarkupData = { set: null, notes: [] };

export interface UseModelMarkupReturn {
  notes: FileNote[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  addViewpointNote: (viewer: Viewer, content: string) => Promise<FileNote | null>;
  deleteNote: (noteId: string) => Promise<void>;
  resolveNote: (noteId: string, status: FileNoteStatus) => Promise<void>;
}

export function useModelMarkup(
  fileItemId: string,
  fileVersionId: string | null,
  issueId?: string | null,
): UseModelMarkupReturn {
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error: loadError, setData } = useAsyncData<MarkupData>(
    `${fileItemId}|${issueId ?? ''}`,
    async () => {
      const { data: listData } = issueId
        ? await markupApi.getSetsByIssue(issueId)
        : await markupApi.getSetsByFile(fileItemId);
      const sets = listData.isSuccess && listData.result ? listData.result : [];
      const active = sets.find((s) => s.status === MarkupSetStatus.Open) ?? sets[0] ?? null;
      if (!active) return EMPTY_MARKUP_DATA;

      const detail = await markupApi.getSetDetail(active.id);
      if (!detail.data.isSuccess || !detail.data.result) return EMPTY_MARKUP_DATA;

      const found = detail.data.result;
      return {
        set: found,
        notes: (found.notes ?? []).filter((n) => n.markupType === MarkupType.Viewpoint),
      };
    },
    { fallback: EMPTY_MARKUP_DATA, toErrorMessage: () => t('markup.error.load') },
  );

  const { set, notes } = data;

  const updateNotes = useCallback(
    (updater: (current: FileNote[]) => FileNote[]) =>
      setData((current) => ({ ...current, notes: updater(current.notes) })),
    [setData],
  );

  const ensureSet = useCallback(async (): Promise<MarkupSet> => {
    if (set) return set;
    const { data: created } = await markupApi.createSet({ fileItemId, fileVersionId, issueId });
    if (!created.isSuccess || !created.result) throw new Error(t('markup.error.save'));
    const createdSet = created.result;
    setData((current) => ({ ...current, set: createdSet }));
    return createdSet;
  }, [set, fileItemId, fileVersionId, issueId, setData]);

  useFileNoteRealtime(fileItemId, {
    onNoteAdded: (note) =>
      updateNotes((prev) =>
        note.markupType !== MarkupType.Viewpoint || prev.some((n) => n.id === note.id) ? prev : [...prev, note],
      ),
    onNoteUpdated: (note) => updateNotes((prev) => prev.map((n) => (n.id === note.id ? note : n))),
    onNoteDeleted: (noteId) => updateNotes((prev) => prev.filter((n) => n.id !== noteId)),
  });

  const addViewpointNote = useCallback(
    async (viewer: Viewer, content: string): Promise<FileNote | null> => {
      setSaving(true);
      setActionError(null);
      try {
        const viewpointStateJson = captureViewpoint(viewer);
        const markupSvg = captureMarkupSvg(viewer);
        if (viewpointStateJson === null || markupSvg === null) {
          setActionError(t('markup.error.capture'));
          return null;
        }
        const thumbnailDataUrl = await captureThumbnail(viewer);

        const target = await ensureSet();
        const { data: added } = await markupApi.addNote(target.id, {
          markupType: MarkupType.Viewpoint,
          content: content.trim() || null,
          viewpointStateJson,
          markupSvg: markupSvg || null,
          thumbnailDataUrl: thumbnailDataUrl || null,
        });

        endDraw(viewer);

        if (added.isSuccess && added.result) {
          const created = added.result;
          updateNotes((prev) => (prev.some((n) => n.id === created.id) ? prev : [...prev, created]));
          return created;
        }
        return null;
      } catch {
        setActionError(t('markup.error.save'));
        return null;
      } finally {
        setSaving(false);
      }
    },
    [ensureSet, updateNotes],
  );

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    const snapshot = notes;
    setActionError(null);
    updateNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      await markupApi.deleteNote(noteId);
    } catch {
      updateNotes(() => snapshot);
      setActionError(t('markup.error.save'));
    }
  }, [notes, updateNotes]);

  const resolveNote = useCallback(async (noteId: string, status: FileNoteStatus): Promise<void> => {
    setActionError(null);
    try {
      const { data: updated } = await markupApi.updateNote(noteId, { status });
      if (updated.isSuccess && updated.result) {
        const next = updated.result;
        updateNotes((prev) => prev.map((n) => (n.id === noteId ? next : n)));
      }
    } catch {
      setActionError(t('markup.error.save'));
    }
  }, [updateNotes]);

  return { notes, loading, saving, error: actionError ?? loadError, addViewpointNote, deleteNote, resolveNote };
}
