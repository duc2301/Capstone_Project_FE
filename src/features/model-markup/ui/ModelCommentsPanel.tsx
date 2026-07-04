import { useState } from 'react';

import { FileNoteStatus } from '@/entities/file-note';
import { t } from '@/shared/lib/i18n';
import { beginDraw, endDraw, hideMarkups, restoreNote } from '../model/apsMarkup';
import { useModelMarkup } from '../model/useModelMarkup';

type Viewer = Autodesk.Viewing.GuiViewer3D;

interface Props {
  viewer: Viewer;
  fileItemId: string;
  fileVersionId: string | null;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ModelCommentsPanel({ viewer, fileItemId, fileVersionId }: Props) {
  const { notes, loading, saving, error, addViewpointNote, deleteNote, resolveNote } = useModelMarkup(fileItemId, fileVersionId);
  const [drawing, setDrawing] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const startDraw = async () => {
    setSelectedId(null);
    await beginDraw(viewer);
    setDrawing(true);
  };

  const cancelDraw = () => {
    endDraw(viewer);
    setDrawing(false);
    setDraftText('');
  };

  const saveNote = async () => {
    const created = await addViewpointNote(viewer, draftText);
    if (created) {
      setDrawing(false);
      setDraftText('');
    }
  };

  const openNote = async (noteId: string, viewpointStateJson: string | null, markupSvg: string | null) => {
    setSelectedId(noteId);
    await restoreNote(viewer, viewpointStateJson, markupSvg, `note-${noteId}`);
  };

  const clearSelection = () => {
    setSelectedId(null);
    hideMarkups(viewer);
  };

  const openCount = notes.filter((n) => n.status === FileNoteStatus.Open).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-bold text-text">{t('markup.model.title')}</h2>
        <span className="rounded-full bg-content-bg px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
          {t('markup.panel.openCount')}: {openCount}/{notes.length}
        </span>
      </div>

      {selectedId && !drawing && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
          <span className="text-xs font-semibold text-primary">{t('markup.model.viewing')}</span>
          <button
            type="button"
            onClick={clearSelection}
            className="flex items-center gap-1 rounded-full bg-text px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            {t('markup.model.closeMarkup')}
          </button>
        </div>
      )}

      {drawing ? (
        <div className="space-y-2 rounded-xl border border-card-border bg-content-bg/50 p-3">
          <p className="text-xs font-medium text-text-secondary">{t('markup.model.drawHint')}</p>
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={2}
            placeholder={t('markup.model.notePlaceholder')}
            className="w-full rounded-lg border border-card-border bg-white px-2 py-1.5 text-sm text-text focus:border-primary focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={cancelDraw} disabled={saving} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-text-muted hover:bg-content-bg disabled:opacity-50">
              {t('markup.action.cancel')}
            </button>
            <button type="button" onClick={() => void saveNote()} disabled={saving} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
              {saving ? t('common.loading') : t('markup.model.saveNote')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void startDraw()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('markup.model.addNote')}
        </button>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">{t('common.loading')}</p>
      ) : notes.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">{t('markup.model.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => {
            const resolved = note.status === FileNoteStatus.Resolved;
            const selected = note.id === selectedId;
            return (
              <li key={note.id} className={`overflow-hidden rounded-xl border transition-colors ${selected ? 'border-primary ring-1 ring-primary/40' : 'border-card-border'}`}>
                <button
                  type="button"
                  onClick={() => void openNote(note.id, note.viewpointStateJson, note.markupSvg)}
                  className="block w-full text-left"
                  title={t('markup.model.openHint')}
                >
                  {note.thumbnailDataUrl ? (
                    <img src={note.thumbnailDataUrl} alt={t('markup.model.scene')} className="h-32 w-full bg-[#2b2b2b] object-cover" />
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center bg-content-bg text-xs text-text-muted">{t('markup.model.scene')}</div>
                  )}
                </button>
                <div className="p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-text-secondary">{note.authorName ?? '-'}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${resolved ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>
                      {resolved ? t('markup.status.resolved') : t('markup.status.open')}
                    </span>
                  </div>
                  {note.content && <p className="whitespace-pre-wrap break-words text-sm text-text">{note.content}</p>}
                  <p className="mt-1 text-[11px] text-text-muted">{formatDateTime(note.createdAt)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void resolveNote(note.id, resolved ? FileNoteStatus.Open : FileNoteStatus.Resolved)}
                      className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-content-bg hover:text-text"
                    >
                      {resolved ? t('markup.action.reopen') : t('markup.action.markDone')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteNote(note.id)}
                      className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-danger transition-colors hover:bg-danger-light"
                    >
                      {t('markup.action.delete')}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
