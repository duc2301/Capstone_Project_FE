import type { Group } from '@/entities/group';
import type { Organization } from '@/entities/organization';
import { organizationApi } from '@/entities/organization';
import { getApiErrorMessage } from '@/shared/api';
import { SearchField } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';
import { useEffect, useMemo, useState } from 'react';
import { GroupPickerList } from './GroupPickerList';

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
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchOrgs = async () => {
      setLoadingOrgs(true);
      try {
        const { data } = await organizationApi.getAll();
        if (!cancelled) {
          setOrganizations(sortByNewest(data.result?.items ?? [], (o) => o.createdAt));
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

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId),
    [groups, selectedGroupId],
  );

  /* Đối tác hiện tại của nhóm không nằm trong danh sách "có thể thêm" — chọn lại nó là vô nghĩa. */
  const currentPartner = useMemo(
    () => organizations.find((o) => o.id === selectedGroup?.organizationId),
    [organizations, selectedGroup],
  );

  const assignableOrganizations = useMemo(
    () => organizations.filter((o) => o.id !== selectedGroup?.organizationId),
    [organizations, selectedGroup],
  );

  const filteredOrganizations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assignableOrganizations;
    return assignableOrganizations.filter((o) =>
      [o.displayName, o.legalName, o.taxCode, o.phone].some((field) =>
        (field ?? '').toLowerCase().includes(q),
      ),
    );
  }, [assignableOrganizations, query]);

  const pickGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedOrgId('');
    setQuery('');
  };

  const handleSubmit = async () => {
    if (!selectedGroupId || !selectedOrgId) return;
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(selectedGroupId, selectedOrgId);
      setSelectedGroupId('');
      setSelectedOrgId('');
      setQuery('');
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.error')));
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = selectedGroupId && selectedOrgId;

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-muted">{t('projects.assignPartner.subtitle')}</p>

      {error && (
        <div className="rounded-[var(--radius-input)] border border-danger/20 bg-danger-light p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* ── Nhóm ────────────────────────────────────────── */}
      <GroupPickerList
        groups={groups}
        loading={loadingGroups}
        selectedGroupId={selectedGroupId}
        onSelect={pickGroup}
      />

      {/* ── Chưa chọn nhóm ──────────────────────────────── */}
      {!selectedGroupId && !loadingGroups && groups.length > 0 && (
        <p className="rounded-[var(--radius-input)] border border-dashed border-card-border bg-input-bg px-4 py-8 text-center text-sm text-text-muted">
          {t('projects.assignPartner.selectGroupFirst')}
        </p>
      )}

      {/* ── Đã chọn nhóm → danh sách đối tác có thể thêm ── */}
      {selectedGroupId && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
            <span>
              <strong className="text-text-secondary">{assignableOrganizations.length}</strong>{' '}
              {t('projects.assignPartner.assignableSuffix')}
            </span>
            {currentPartner && (
              <>
                <span className="h-1 w-1 rounded-full bg-card-border" />
                <span>
                  {t('projects.assignPartner.currentPartner')}:{' '}
                  <strong className="text-text-secondary">
                    {currentPartner.displayName || currentPartner.legalName}
                  </strong>{' '}
                  · {t('projects.assignPartner.replaceHint')}
                </span>
              </>
            )}
          </div>

          <SearchField
            value={query}
            onChange={setQuery}
            placeholder={t('projectDetail.partners.searchOrg')}
          />

          <div className="max-h-72 space-y-1 overflow-y-auto rounded-[var(--radius-input)] border border-card-border p-1.5">
            {loadingOrgs ? (
              <p className="px-3 py-8 text-center text-sm text-text-muted">{t('common.loading')}</p>
            ) : assignableOrganizations.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-text-muted">{t('projectDetail.partners.noOrgs')}</p>
            ) : filteredOrganizations.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-text-muted">{t('projectDetail.partners.noOrg')}</p>
            ) : (
              filteredOrganizations.map((org) => {
                const isSelected = selectedOrgId === org.id;
                const orgName = org.displayName || org.legalName || '---';
                return (
                  <button
                    key={org.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedOrgId(org.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${isSelected ? 'bg-primary-ghost ring-1 ring-primary/30' : 'hover:bg-content-bg'}`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${isSelected ? 'border-primary' : 'border-input-border'}`}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                      {orgName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text">{orgName}</span>
                      <span className="block truncate text-xs text-text-muted">
                        {org.taxCode || '---'}
                        {org.phone ? ` · ${org.phone}` : ''}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="flex justify-end">
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
      )}
    </div>
  );
}
