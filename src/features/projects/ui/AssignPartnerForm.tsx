import type { Group } from '@/entities/group';
import type { Organization } from '@/entities/organization';
import { organizationApi } from '@/entities/organization';
import { getApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';
import { useEffect, useState } from 'react';

interface AssignPartnerFormProps {
  groups: Group[];
  loadingGroups: boolean;
  onSubmit: (groupId: string, organizationId: string) => Promise<void>;
}

export function AssignPartnerForm({ groups, loadingGroups, onSubmit }: AssignPartnerFormProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchOrgs = async () => {
      setLoadingOrgs(true);
      try {
        const { data } = await organizationApi.getAll();
        if (!cancelled) {
          setOrganizations(sortByNewest(data.result ?? [], (o) => o.createdAt));
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('common.error')));
        }
      } finally {
        if (!cancelled) {
          setLoadingOrgs(false);
        }
      }
    };
    fetchOrgs();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async () => {
    if (!selectedGroupId || !selectedOrgId) return;
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(selectedGroupId, selectedOrgId);
      setSelectedGroupId('');
      setSelectedOrgId('');
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.error')));
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = selectedGroupId && selectedOrgId;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <p className="text-sm text-text-secondary">{t('projects.assignPartner.subtitle')}</p>

      {error && (
        <div className="rounded-[var(--radius-input)] border border-danger/20 bg-danger-light p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* ── Nhóm ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <label className="field-label">{t('projectDetail.partners.group')}</label>
        {loadingGroups ? (
          <p className="text-sm text-text-muted">{t('common.loading')}</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-text-muted">{t('projectDetail.partners.noGroups')}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {groups.map((group) => {
              const isSelected = selectedGroupId === group.id;
              // Just a dummy number or members length
              const badgeCount = group.members?.length || 0;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-card-border bg-card text-text-secondary hover:border-primary/50'
                    }`}
                >
                  {group.name}
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-content-bg text-text-muted'
                      }`}
                  >
                    {badgeCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Chọn tổ chức (đối tác) ──────────────────────── */}
      <div className="flex flex-col gap-2">
        <label className="field-label">{t('projectDetail.partners.selectOrg')}</label>
        {loadingOrgs ? (
          <p className="text-sm text-text-muted">{t('common.loading')}</p>
        ) : organizations.length === 0 ? (
          <p className="text-sm text-text-muted">{t('projectDetail.partners.noOrgs')}</p>
        ) : (
          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto admin-scrollbar pr-2">
            {organizations.map((org) => {
              const isSelected = selectedOrgId === org.id;
              const orgName = org.displayName || org.legalName || '---';
              const initial = orgName.charAt(0).toUpperCase();
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => setSelectedOrgId(org.id)}
                  className={`flex items-center gap-4 rounded-[var(--radius-input)] border p-4 text-left transition-colors ${isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-card-border bg-card hover:border-primary/50'
                    }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                    }`}>
                    {initial}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{orgName}</p>
                    <p className="truncate text-xs text-text-muted">
                      {org.taxCode || '---'} {org.phone ? `· ${org.phone}` : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-end">
        <button
          type="button"
          disabled={!isFormValid || submitting}
          onClick={handleSubmit}
          className="btn-modal-primary"
        >
          {submitting ? t('common.loading') : t('projects.assignPartner.submit')}
        </button>
      </div>
    </div>
  );
}
