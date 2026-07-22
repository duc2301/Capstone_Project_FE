import type { MarkupAuthorOption, MarkupStatusFilter } from '@/shared/components';

import type { FileNote } from './fileNote.types';
import { FileNoteStatus } from './fileNote.types';

function authorKey(note: FileNote): string {
  return note.authorAccountId ?? note.authorName ?? '';
}

export function buildMarkupAuthorOptions(notes: FileNote[], unknownLabel: string): MarkupAuthorOption[] {
  const byKey = new Map<string, string>();
  for (const note of notes) {
    const key = authorKey(note);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, note.authorName ?? unknownLabel);
  }
  return Array.from(byKey, ([id, name]) => ({ id, name }));
}

export function filterMarkupNotes(
  notes: FileNote[],
  authorId: string,
  status: MarkupStatusFilter,
): FileNote[] {
  return notes.filter((note) => {
    if (authorId && authorKey(note) !== authorId) return false;
    if (status === 'open' && note.status !== FileNoteStatus.Open) return false;
    if (status === 'resolved' && note.status !== FileNoteStatus.Resolved) return false;
    return true;
  });
}
