import { useCallback, useEffect, useState } from 'react';

import type {
  CreateFileNotePayload,
  FileNote,
  MarkupSet,
  UpdateFileNotePayload,
} from '@/entities/file-note';
import {
  FileNoteStatus,
  markupApi,
  MarkupSetStatus,
  MarkupType,
  useFileNoteRealtime,
} from '@/entities/file-note';
import { t } from '@/shared/lib/i18n';

/** Lọc lấy riêng mấy cái markup 2D thôi */
const is2dNote = (n: FileNote): boolean => n.markupType !== MarkupType.Viewpoint;

export interface UseInlineMarkupReturn {
  notes: FileNote[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  createNote: (payload: CreateFileNotePayload) => Promise<FileNote | null>;
  updateNote: (noteId: string, payload: UpdateFileNotePayload) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  resolveNote: (noteId: string, status: FileNoteStatus) => Promise<void>;
}

export function useInlineMarkup(
  fileItemId: string,
  fileVersionId: string | null,
  enabled = true,
  issueId?: string | null,
): UseInlineMarkupReturn {
  const [set, setSet] = useState<MarkupSet | null>(null);
  const [notes, setNotes] = useState<FileNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
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
          setNotes((detail.data.result.notes ?? []).filter(is2dNote));
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
  }, [fileItemId, enabled, issueId]);

  const ensureSet = useCallback(async (): Promise<MarkupSet> => {
    if (set) return set;
    const { data } = await markupApi.createSet({ fileItemId, fileVersionId, issueId });
    if (!data.isSuccess || !data.result) throw new Error(t('markup.error.save'));
    setSet(data.result);
    return data.result;
  }, [set, fileItemId, fileVersionId, issueId]);

  useFileNoteRealtime(enabled ? fileItemId : null, {
    onNoteAdded: (note) =>
      setNotes((prev) => (!is2dNote(note) || prev.some((n) => n.id === note.id) ? prev : [...prev, note])),
    onNoteUpdated: (note) =>
      setNotes((prev) => (is2dNote(note) ? prev.map((n) => (n.id === note.id ? note : n)) : prev)),
    onNoteDeleted: (noteId) => setNotes((prev) => prev.filter((n) => n.id !== noteId)),
  });

  const createNote = useCallback(
    async (payload: CreateFileNotePayload): Promise<FileNote | null> => {
      setSaving(true);
      try {
        const target = await ensureSet();
        const { data } = await markupApi.addNote(target.id, payload);
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

  const updateNote = useCallback(async (noteId: string, payload: UpdateFileNotePayload): Promise<void> => {
    // Mẹo: Cập nhật giao diện trước cho mượt (optimistic update) rồi mới chờ server
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, ...stripUndefined(payload) } : n)));
    try {
      const { data } = await markupApi.updateNote(noteId, payload);
      if (data.isSuccess && data.result) {
        const updated = data.result;
        setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      }
    } catch {
      setError(t('markup.error.save'));
    }
  }, []);

  const deleteNote = useCallback(
    async (noteId: string): Promise<void> => {
      const snapshot = notes;
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      try {
        await markupApi.deleteNote(noteId);
      } catch {
        setNotes(snapshot);
        setError(t('markup.error.save'));
      }
    },
    [notes],
  );

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

  return { notes, loading, saving, error, createNote, updateNote, deleteNote, resolveNote };
}

function stripUndefined(payload: UpdateFileNotePayload): Partial<FileNote> {
  const out: Partial<FileNote> = {};
  if (payload.markupType !== undefined) out.markupType = payload.markupType;
  if (payload.pageNumber !== undefined) out.pageNumber = payload.pageNumber;
  if (payload.coordinateJson !== undefined) out.coordinateJson = payload.coordinateJson;
  if (payload.styleJson !== undefined) out.styleJson = payload.styleJson;
  if (payload.content !== undefined) out.content = payload.content;
  if (payload.status !== undefined) out.status = payload.status;
  return out;
}
