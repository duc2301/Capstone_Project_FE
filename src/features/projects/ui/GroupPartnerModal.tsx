import { useState } from 'react';

import type { CreateGroupPayload, Group } from '@/entities/group';
import type { Organization } from '@/entities/organization';
import { getApiErrorMessage } from '@/shared/api';
import { Modal } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

interface Props {
  group: Group;
  organizations: Organization[];
  onClose: () => void;
  onSubmit: (groupId: string, payload: Partial<CreateGroupPayload>) => Promise<void>;
  onError: (message: string) => void;
}

export function GroupPartnerModal({ group, organizations, onClose, onSubmit, onError }: Props) {
  const [organizationId, setOrganizationId] = useState<string | null>(group.organizationId ?? null);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const term = query.trim().toLowerCase();
  const filtered = term
    ? organizations.filter((org) =>
        (org.displayName || org.legalName).toLowerCase().includes(term)
        || (org.taxCode ?? '').toLowerCase().includes(term))
    : organizations;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSubmit(group.id, { organizationId: organizationId ?? undefined });
      onClose();
    } catch (err) {
      onError(getApiErrorMessage(err, t('common.error')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('projectDetail.teams.partner.title')} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="modal-text">{t('projectDetail.teams.partner.desc')}</p>

        <div className="flex items-center gap-2 rounded-[var(--radius-input)] border border-input-border bg-input-bg px-3 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-text-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('projectDetail.teams.partner.search')}
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-placeholder"
          />
        </div>

        <div className="admin-scrollbar flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => setOrganizationId(null)}
            className={`flex items-center gap-3 rounded-[var(--radius-button)] border p-3 text-left transition-colors ${
              !organizationId ? 'border-primary bg-primary/5' : 'border-card-border bg-card hover:border-primary/50'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-content-bg text-text-muted">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </span>
            <p className="text-sm font-semibold text-text">{t('projectDetail.teams.editGroup.noPartner')}</p>
          </button>

          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-text-muted">{t('projectDetail.teams.partner.empty')}</p>
          ) : (
            filtered.map((org) => {
              const orgName = org.displayName || org.legalName;
              const selected = organizationId === org.id;
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => setOrganizationId(selected ? null : org.id)}
                  className={`flex items-center gap-3 rounded-[var(--radius-button)] border p-3 text-left transition-colors ${
                    selected ? 'border-primary bg-primary/5' : 'border-card-border bg-card hover:border-primary/50'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    selected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                  }`}>
                    {orgName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{orgName}</p>
                    <p className="truncate text-xs text-text-muted">{org.taxCode || '—'}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" disabled={saving} onClick={onClose} className="btn-modal-ghost">
            {t('projectDetail.teams.editGroup.cancel')}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="btn-modal-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t('common.loading') : t('projectDetail.teams.editGroup.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
