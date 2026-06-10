import { useState } from 'react';

import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';
import type { CreateProjectWithGroupsInput, ProjectGroupDraft } from '../model/useProjects';
import { AddressField } from './AddressField';

interface Props {
  onSubmit: (input: CreateProjectWithGroupsInput) => Promise<void>;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';

const DEFAULT_GROUP_KEYS: TranslationKey[] = [
  'projects.defaultGroup.design',
  'projects.defaultGroup.verification',
  'projects.defaultGroup.contractor',
  'projects.defaultGroup.supervision',
  'projects.defaultGroup.owner',
];

interface GroupRow extends ProjectGroupDraft {
  key: string;
}

const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `g-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const buildDefaultGroups = (): GroupRow[] =>
  DEFAULT_GROUP_KEYS.map((key) => ({ key: newKey(), name: t(key), description: '' }));

export function CreateProjectForm({ onSubmit, onCancel }: Props) {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [groups, setGroups] = useState<GroupRow[]>(buildDefaultGroups);
  const [submitting, setSubmitting] = useState(false);

  const updateGroup = (key: string, patch: Partial<ProjectGroupDraft>) => {
    setGroups((prev) => prev.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  };

  const addGroup = () => setGroups((prev) => [...prev, { key: newKey(), name: '', description: '' }]);

  const removeGroup = (key: string) =>
    setGroups((prev) => prev.filter((g) => g.key !== key));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    setSubmitting(true);
    try {
      const lat = Number.parseFloat(latitude);
      const lng = Number.parseFloat(longitude);
      await onSubmit({
        projectName: projectName.trim(),
        projectDescription: projectDescription.trim() || undefined,
        address: address.trim() || undefined,
        latitude: Number.isFinite(lat) ? lat : undefined,
        longitude: Number.isFinite(lng) ? lng : undefined,
        groups: groups.filter((g) => g.name.trim()),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Thông tin dự án ─────────────────────────── */}
      <div className="space-y-1.5">
        <label htmlFor="project-name" className="block text-sm font-medium text-text-secondary">
          {t('projects.form.name')}
        </label>
        <input
          id="project-name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder={t('projects.form.name')}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="project-desc" className="block text-sm font-medium text-text-secondary">
          {t('projects.form.description')}
        </label>
        <textarea
          id="project-desc"
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          placeholder={t('projects.form.description')}
          rows={3}
          className={inputClass}
        />
      </div>

      {/* ── Vị trí dự án (ProjectLocation) — geocode miễn phí qua OpenStreetMap ── */}
      <div className="space-y-2 border-t border-card-border pt-5">
        <h3 className="font-heading text-sm font-bold text-text">{t('projects.form.location')}</h3>
        <AddressField
          value={{ address, latitude, longitude }}
          onChange={(loc) => {
            setAddress(loc.address);
            setLatitude(loc.latitude);
            setLongitude(loc.longitude);
          }}
        />
      </div>

      {/* ── Nhóm tham gia ───────────────────────────── */}
      <div className="space-y-3 border-t border-card-border pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-sm font-bold text-text">{t('projects.groups.title')}</h3>
            <p className="mt-1 text-xs text-text-muted">{t('projects.groups.hint')}</p>
          </div>
          <button
            type="button"
            onClick={addGroup}
            className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-button)] border border-primary px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary-ghost"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('projects.groups.add')}
          </button>
        </div>

        {groups.length === 0 ? (
          <p className="rounded-[var(--radius-input)] border border-dashed border-card-border bg-input-bg px-4 py-3 text-sm text-text-muted">
            {t('projects.groups.empty')}
          </p>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.key}
                className="flex items-start gap-3 rounded-[var(--radius-input)] border border-card-border bg-input-bg p-3"
              >
                <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    value={group.name}
                    onChange={(e) => updateGroup(group.key, { name: e.target.value })}
                    placeholder={t('projects.groups.name')}
                    aria-label={t('projects.groups.name')}
                    className="w-full rounded-[var(--radius-input)] border border-input-border bg-card px-3 py-2 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    value={group.description ?? ''}
                    onChange={(e) => updateGroup(group.key, { description: e.target.value })}
                    placeholder={t('projects.groups.description')}
                    aria-label={t('projects.groups.description')}
                    className="w-full rounded-[var(--radius-input)] border border-input-border bg-card px-3 py-2 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeGroup(group.key)}
                  title={t('projects.groups.remove')}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-all duration-150 hover:bg-danger-light hover:text-danger"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions ─────────────────────────────────── */}
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
          disabled={submitting}
          className="rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover disabled:opacity-50"
        >
          {submitting ? t('common.loading') : t('projects.create.submit')}
        </button>
      </div>
    </form>
  );
}
