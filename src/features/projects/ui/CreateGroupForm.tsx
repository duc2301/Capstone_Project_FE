import { useState } from 'react';

import { t } from '@/shared/lib/i18n';
import type { AddGroupInput } from '../model/useProjectGroups';

interface Props {
  onSubmit: (input: AddGroupInput) => Promise<void>;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';

export function CreateGroupForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || undefined });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="group-name" className="block text-sm font-medium text-text-secondary">
          {t('projects.groups.name')}
        </label>
        <input
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('projects.groups.name')}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="group-desc" className="block text-sm font-medium text-text-secondary">
          {t('projects.groups.description')}
        </label>
        <textarea
          id="group-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('projects.groups.description')}
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-card-border pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[var(--radius-button)] border border-card-border bg-card px-6 py-2.5 text-sm font-semibold text-text-secondary transition-all duration-200 hover:bg-content-bg"
        >
          {t('account.cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover disabled:opacity-50"
        >
          {submitting ? t('common.loading') : t('projectDetail.teams.groupForm.submit')}
        </button>
      </div>
    </form>
  );
}
