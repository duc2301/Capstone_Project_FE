import { useCallback, useEffect, useState } from 'react';

import type { FileNote, MarkupSet } from '@/entities/file-note';
import {
  FileNoteStatus,
  markupApi,
  MarkupSetStatus,
  MarkupType,
} from '@/entities/file-note';
import { t } from '@/shared/lib/i18n';
import { captureMarkupSvg, captureThumbnail, captureViewpoint, endDraw } from './apsMarkup';
import { useModelMarkupRealtime } from './useModelMarkupRealtime';

type Viewer = Autodesk.Viewing.GuiViewer3D;

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
  const [set, setSet] = useState<MarkupSet | null>(null);
  const [notes, setNotes] = useState<FileNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = issueId
          ? await markupApi.getSetsByIssue(issueId)
          : await markupApi.getSetsByFile(fileItemId);
        const sets = data.isSuccess && data.result ? data.result : [];
        const active = sets.find((s) => s.status === MarkupSetStatus.Open) ?? sets[0] ?? null;
        if (!active) {
          if (!cancelled) {
            setSet(null);
            setNotes([]);
          }
          return;
        }
        const detail = await markupApi.getSetDetail(active.id);
        if (!cancelled && detail.data.isSuccess && detail.data.result) {
          setSet(detail.data.result);
          setNotes((detail.data.result.notes ?? []).filter((n) => n.markupType === MarkupType.Viewpoint));
        }
      } catch {
        if (!cancelled) setError(t('markup.error.load'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileItemId, issueId]);

  const ensureSet = useCallback(async (): Promise<MarkupSet> => {
    if (set) return set;
    const { data } = await markupApi.createSet({ fileItemId, fileVersionId, issueId });
    if (!data.isSuccess || !data.result) throw new Error(t('markup.error.save'));
    setSet(data.result);
    return data.result;
  }, [set, fileItemId, fileVersionId, issueId]);

  useModelMarkupRealtime(fileItemId, {
    onNoteAdded: (note) =>
      setNotes((prev) =>
        note.markupType !== MarkupType.Viewpoint || prev.some((n) => n.id === note.id) ? prev : [...prev, note],
      ),
    onNoteUpdated: (note) => setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n))),
    onNoteDeleted: (noteId) => setNotes((prev) => prev.filter((n) => n.id !== noteId)),
  });

  const addViewpointNote = useCallback(
    async (viewer: Viewer, content: string): Promise<FileNote | null> => {
      setSaving(true);
      try {
        const viewpointStateJson = captureViewpoint(viewer);
        const markupSvg = captureMarkupSvg(viewer);
        const thumbnailDataUrl = await captureThumbnail(viewer);

        const target = await ensureSet();
        const { data } = await markupApi.addNote(target.id, {
          markupType: MarkupType.Viewpoint,
          content: content.trim() || null,
          viewpointStateJson,
          markupSvg: markupSvg || null,
          thumbnailDataUrl: thumbnailDataUrl || null,
        });

        endDraw(viewer);

        if (data.isSuccess && data.result) {
          const created = data.result;
          setNotes((prev) => (prev.some((n) => n.id === created.id) ? prev : [...prev, created]));
          return created;
        }
        return null;
      } catch {
        setError(t('markup.error.save'));
        return null;
      } finally {
        setSaving(false);
      }
    },
    [ensureSet],
  );

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    const snapshot = notes;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      await markupApi.deleteNote(noteId);
    } catch {
      setNotes(snapshot);
      setError(t('markup.error.save'));
    }
  }, [notes]);

  const resolveNote = useCallback(async (noteId: string, status: FileNoteStatus): Promise<void> => {
    try {
      const { data } = await markupApi.updateNote(noteId, { status });
      if (data.isSuccess && data.result) {
        const updated = data.result;
        setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      }
    } catch {
      setError(t('markup.error.save'));
    }
  }, []);

  return { notes, loading, saving, error, addViewpointNote, deleteNote, resolveNote };
}
