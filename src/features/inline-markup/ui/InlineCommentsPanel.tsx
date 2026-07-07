import type { FileNote, MarkupType } from '@/entities/file-note';
import { FileNoteStatus, MarkupType as MT } from '@/entities/file-note';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';
import { useInlineMarkupContext } from '../model/inlineMarkupContext';

/** Tab "Ghi chú" nằm ở cột bên phải */
export function InlineCommentsPanel() {
  const c = useInlineMarkupContext();
  const openCount = c.notes.filter((n) => n.status === FileNoteStatus.Open).length;

  const jumpTo = (note: FileNote) => {
    if (note.pageNumber) c.setPage(note.pageNumber);
    c.setSelectedId(note.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-bold text-text">{t('markup.inline.title')}</h2>
        <span className="rounded-full bg-content-bg px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
          {t('markup.panel.openCount')}: {openCount}/{c.notes.length}
        </span>
      </div>

      <p className="rounded-xl border border-card-border bg-content-bg/40 px-3 py-2 text-xs text-text-secondary">
        {t('markup.inline.panelHint')}
      </p>

      {c.loading ? (
        <p className="py-8 text-center text-sm text-text-muted">{t('common.loading')}</p>
      ) : c.notes.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">{t('markup.inline.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {c.notes.map((n) => (
            <NoteRow
              key={n.id}
              note={n}
              selected={n.id === c.selectedId}
              onJump={() => jumpTo(n)}
              onResolve={() => c.resolveNote(n.id, n.status === FileNoteStatus.Resolved ? FileNoteStatus.Open : FileNoteStatus.Resolved)}
              onDelete={() => {
                void c.deleteNote(n.id);
                if (c.selectedId === n.id) c.setSelectedId(null);
              }}
            />
          ))}
        </ul>
      )}

      {c.error && <p className="text-xs font-medium text-danger">{c.error}</p>}
    </div>
  );
}

function NoteRow({
  note,
  selected,
  onJump,
  onResolve,
  onDelete,
}: {
  note: FileNote;
  selected: boolean;
  onJump: () => void;
  onResolve: () => void;
  onDelete: () => void;
}) {
  const resolved = note.status === FileNoteStatus.Resolved;
  return (
    <li className={`overflow-hidden rounded-xl border transition-colors ${selected ? 'border-primary ring-1 ring-primary/40' : 'border-card-border'}`}>
      <button type="button" onClick={onJump} title={t('markup.inline.jumpHint')} className="block w-full px-3 py-2 text-left">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-text-secondary">{t(typeLabelKey(note.markupType))}</span>
          <span className="rounded-full bg-content-bg px-2 py-0.5 text-[10px] font-semibold text-text-muted">
            {note.pageNumber ? `${t('markup.inline.page')} ${note.pageNumber}` : t('markup.inline.imageLabel')}
          </span>
        </div>
        {note.content ? <p className="break-words text-sm text-text">{note.content}</p> : null}
        <p className="mt-1 text-[11px] text-text-muted">{note.authorName ?? '-'}</p>
      </button>
      <div className="flex items-center gap-2 border-t border-card-border/60 px-3 py-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${resolved ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>
          {resolved ? t('markup.status.resolved') : t('markup.status.open')}
        </span>
        <button type="button" onClick={onResolve} className="ml-auto rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-text-secondary hover:bg-content-bg hover:text-text">
          {resolved ? t('markup.action.reopen') : t('markup.action.markDone')}
        </button>
        <button type="button" onClick={onDelete} className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-danger hover:bg-danger-light">
          {t('markup.action.delete')}
        </button>
      </div>
    </li>
  );
}

function typeLabelKey(type: MarkupType): TranslationKey {
  switch (type) {
    case MT.Rectangle: return 'markup.tool.rectangle';
    case MT.Ellipse: return 'markup.tool.ellipse';
    case MT.Arrow: return 'markup.tool.arrow';
    case MT.Polyline: return 'markup.tool.polyline';
    case MT.Freehand: return 'markup.tool.freehand';
    case MT.Text: return 'markup.tool.text';
    case MT.Callout: return 'markup.tool.callout';
    case MT.Cloud: return 'markup.tool.cloud';
    default: return 'markup.tool.select';
  }
}
