import { useMemo, useState } from 'react';

import type { Group } from '@/entities/group';
import type { Organization } from '@/entities/organization';
import { getApiErrorMessage } from '@/shared/api';
import { Modal } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

interface Props {
  groups: Group[];
  organizations: Organization[];
  onClose: () => void;
  onSubmit: (groupId: string, organizationId: string) => Promise<void>;
}

const orgLabel = (org: Organization) => org.displayName || org.legalName;

export function AddPartnerModal({ groups, organizations, onClose, onSubmit }: Props) {
  const [query, setQuery] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return organizations;
    return organizations.filter(
      (org) =>
        orgLabel(org).toLowerCase().includes(term)
        || (org.taxCode ?? '').toLowerCase().includes(term),
    );
  }, [organizations, query]);

  const handleSubmit = async () => {
    if (!organizationId || !groupId) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(groupId, organizationId);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.error')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('projectDetail.partners.addTitle')} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="space-y-2">
          <label className="field-label">{t('projectDetail.partners.selectOrg')}</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('projectDetail.partners.searchOrg')}
            className="field-input"
          />
          <div className="admin-scrollbar flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <p className="modal-text py-6 text-center">{t('projectDetail.partners.noOrg')}</p>
            ) : (
              filtered.map((org) => {
                const active = org.id === organizationId;
                const assignedGroups = groups.filter((g) => g.organizationId === org.id);
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => setOrganizationId(org.id)}
                    className={`flex items-center gap-3 rounded-[var(--radius-button)] border p-3 text-left transition-colors ${
                      active ? 'border-primary bg-primary/5' : 'border-card-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-light font-heading font-bold text-primary">
                      {orgLabel(org).charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block cell-wrap text-sm font-semibold text-text">{orgLabel(org)}</span>
                      {org.taxCode && <span className="field-hint block">{t('org.taxCode')}: {org.taxCode}</span>}
                      {assignedGroups.length > 0 && (
                        <span className="field-hint block">
                          {t('projectDetail.partners.alreadyInGroups')}: {assignedGroups.map((g) => g.name).join(', ')}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="field-label" htmlFor="add-partner-group">
            {t('projectDetail.partners.selectGroup')}
          </label>
          {groups.length === 0 ? (
            <p className="modal-text">{t('projectDetail.partners.noGroups')}</p>
          ) : (
            <select
              id="add-partner-group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="field-select"
            >
              <option value="">{t('projectDetail.partners.selectGroupPlaceholder')}</option>
              {groups.map((g) => {
                const current = organizations.find((o) => o.id === g.organizationId);
                return (
                  <option key={g.id} value={g.id}>
                    {g.name}
                    {current ? ` — ${t('projectDetail.partners.currentPartner')}: ${orgLabel(current)}` : ''}
                  </option>
                );
              })}
            </select>
          )}
          <p className="field-hint">{t('projectDetail.partners.replaceHint')}</p>
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-modal-ghost">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={saving || !organizationId || !groupId}
            onClick={handleSubmit}
            className="btn-modal-primary"
          >
            {saving ? t('projectDetail.partners.adding') : t('projectDetail.partners.add')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
