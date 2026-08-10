import { useRef, useState } from 'react';

import type { Organization } from '@/entities/organization';
import type { Project, UpdateProjectPayload } from '@/entities/project';
import { projectApi } from '@/entities/project';
import { getApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

import { AddressField } from './AddressField';

const inputCls =
  'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';

const selectCls = 'field-select py-3';

const labelCls = 'mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-text-secondary';

interface Props {
  project: Project;
  organizations: Organization[];
  onSaved: () => Promise<void> | void;
  onCancel: () => void;
}

const trimmedOrUndefined = (value: string): string | undefined => value.trim() || undefined;

export function EditProjectForm({ project, organizations, onSaved, onCancel }: Props) {
  const [projectName, setProjectName] = useState(project.projectName);
  const [projectCode, setProjectCode] = useState(project.projectCode ?? '');
  const [projectDescription, setProjectDescription] = useState(project.projectDescription ?? '');
  const [ownerOrganizationId, setOwnerOrganizationId] = useState(project.ownerOrganizationId ?? '');
  const [contactAddress, setContactAddress] = useState(project.contactAddress ?? '');
  const [location, setLocation] = useState({
    address: project.location?.address ?? '',
    latitude: project.location?.latitude?.toString() ?? '',
    longitude: project.location?.longitude?.toString() ?? '',
  });

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(project.projectImageUrl ?? null);
  const previewUrlRef = useRef<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = (file: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = file ? URL.createObjectURL(file) : null;
    setPreview(previewUrlRef.current ?? project.projectImageUrl ?? null);
    setImage(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || saving) return;

    setSaving(true);
    setError(null);
    try {
      const payload: UpdateProjectPayload = {
        projectName: projectName.trim(),
        projectCode: trimmedOrUndefined(projectCode),
        projectDescription: trimmedOrUndefined(projectDescription),
        ownerOrganizationId: ownerOrganizationId || undefined,
        contactAddress: trimmedOrUndefined(contactAddress),
        address: trimmedOrUndefined(location.address),
        latitude: location.latitude ? Number(location.latitude) : undefined,
        longitude: location.longitude ? Number(location.longitude) : undefined,
      };

      await projectApi.update(project.id, payload);
      if (image) await projectApi.uploadImage(project.id, image);
      await onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.error')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-6">
      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger-light px-4 py-3">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <label className={labelCls} htmlFor="edit-project-name">
              {t('projects.form.name')}<span className="ml-1 text-danger">*</span>
            </label>
            <input
              id="edit-project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="edit-project-code">{t('projects.stepper.s1.code')}</label>
            <input
              id="edit-project-code"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              placeholder={t('projects.stepper.s1.codePlaceholder')}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="edit-project-description">{t('projects.form.description')}</label>
            <textarea
              id="edit-project-description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder={t('projects.stepper.s1.descPlaceholder')}
              rows={3}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="edit-project-owner">{t('projects.form.owner')}</label>
            <select
              id="edit-project-owner"
              value={ownerOrganizationId}
              onChange={(e) => setOwnerOrganizationId(e.target.value)}
              className={selectCls}
            >
              <option value="">{t('projects.form.ownerSelect')}</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.displayName || org.legalName}{org.taxCode ? ` (MST: ${org.taxCode})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="edit-project-contact">{t('projects.form.contactAddress')}</label>
            <input
              id="edit-project-contact"
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              placeholder={t('projects.form.contactAddress')}
              className={inputCls}
            />
          </div>

          <AddressField value={location} onChange={setLocation} />
        </div>

        <div className="flex flex-col">
          <span className={labelCls}>{t('projects.stepper.s1.image')}</span>
          <div className="group relative flex min-h-[260px] flex-1 items-center justify-center overflow-hidden rounded-[var(--radius-card)] border-2 border-dashed border-card-border bg-content-bg/60">
            {preview ? (
              <>
                <img src={preview} alt={projectName} className="h-full w-full object-cover" />
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 text-sm font-semibold text-white opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                  {t('projects.stepper.s1.addImage')}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
                  />
                </label>
              </>
            ) : (
              <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 p-4 text-text-muted transition-colors hover:text-primary">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                  <polyline points="12 16 12 10" />
                  <polyline points="9 13 12 10 15 13" />
                </svg>
                <span className="text-sm font-semibold">{t('projects.stepper.s1.addImage')}</span>
                <span className="text-xs text-text-placeholder">{t('projects.stepper.s1.imageHint')}</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-card-border/60 pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-[var(--radius-button)] px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:opacity-50"
        >
          {t('account.cancel')}
        </button>
        <button
          type="submit"
          disabled={saving || !projectName.trim()}
          className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {saving && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
            </svg>
          )}
          {t('common.saveChanges')}
        </button>
      </div>
    </form>
  );
}
