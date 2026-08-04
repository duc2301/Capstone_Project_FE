import { useState } from 'react';

import type { Organization, UpdateOrganizationPayload } from '@/entities/organization';
import { lookupTaxCode, TAX_CODE_MAX_LENGTH, TAX_CODE_MIN_LENGTH } from '@/entities/organization';
import type { OrganizationType, CreateOrganizationTypePayload } from '@/entities/organization-type';
import { getApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

const OTHER_VALUE = '__other__';

interface Props {
  organization: Organization;
  organizations: Organization[];
  orgTypes: OrganizationType[];
  onSubmit: (id: string, payload: UpdateOrganizationPayload, selectedAccountIds?: string[], initialAccountIds?: string[]) => Promise<void>;
  onCancel: () => void;
  onCreateOrgType?: (payload: CreateOrganizationTypePayload) => Promise<OrganizationType | null>;
}

export function UpdateOrganizationForm({ organization, organizations, orgTypes, onSubmit, onCancel, onCreateOrgType }: Props) {
  const [form, setForm] = useState<UpdateOrganizationPayload>({
    taxCode: organization.taxCode,
    legalName: organization.legalName,
    displayName: organization.displayName ?? '',
    internationalName: organization.internationalName ?? '',
    organizationTypeId: organization.organizationTypeId,
    address: organization.address ?? '',
    phone: organization.phone ?? '',
    email: organization.email ?? '',
    isJointVenture: organization.isJointVenture,
    jointVentureMemberIds: organization.jointVentureMemberIds ?? [],
    representativeOrganizationId: organization.representativeOrganizationId ?? '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isOtherType, setIsOtherType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookup = async () => {
    setLookupError(null);
    setLookingUp(true);
    const outcome = await lookupTaxCode(form.taxCode ?? '');
    setLookingUp(false);

    if (outcome.status === 'notFound') {
      setLookupError(t('org.lookup.notFound'));
      return;
    }
    if (outcome.status === 'unavailable') {
      setLookupError(t('org.lookup.serviceError'));
      return;
    }

    setForm((prev) => ({
      ...prev,
      legalName: outcome.data.legalName || prev.legalName,
      displayName: outcome.data.shortName || outcome.data.legalName || prev.displayName,
      internationalName: outcome.data.internationalName || prev.internationalName,
      address: outcome.data.address || prev.address,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === OTHER_VALUE) {
      setIsOtherType(true);
      setCustomTypeName('');
      setForm((prev) => ({ ...prev, organizationTypeId: '' }));
    } else {
      setIsOtherType(false);
      setCustomTypeName('');
      setForm((prev) => ({ ...prev, organizationTypeId: val }));
    }
  };

  const handleBackToSelect = () => {
    setIsOtherType(false);
    setCustomTypeName('');
    setForm((prev) => ({ ...prev, organizationTypeId: organization.organizationTypeId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      let finalPayload: UpdateOrganizationPayload = {
        ...form,
        taxCode: form.taxCode || undefined,
        displayName: form.displayName || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        representativeOrganizationId: form.representativeOrganizationId || undefined,
      };

      if (isOtherType && customTypeName.trim() && onCreateOrgType) {
        const code = customTypeName.trim().replace(/\s+/g, '');
        const created = await onCreateOrgType({ code, name: customTypeName.trim() });
        if (!created) {
          setSubmitError(t('org.orgType.createError'));
          return;
        }
        finalPayload = { ...finalPayload, organizationTypeId: created.id };
      }

      await onSubmit(organization.id, finalPayload, undefined, undefined);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, t('org.save.error')));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'field-input';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <p className="rounded-[var(--radius-card)] border border-danger/30 bg-danger-light px-4 py-2.5 text-sm font-medium text-danger">
          {submitError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 animate-fade-in">
          {/* Tax Code - Hidden for Joint Ventures */}
          {!organization.isJointVenture && (
            <div className="space-y-1.5">
              <label htmlFor="edit-taxCode" className="field-label">
                {t('org.taxCode')}
              </label>
              <div className="flex gap-2">
                <input
                  id="edit-taxCode"
                  name="taxCode"
                  value={form.taxCode ?? ''}
                  onChange={handleChange}
                  placeholder={t('org.taxCodePlaceholder')}
                  maxLength={TAX_CODE_MAX_LENGTH}
                  pattern="^\d{10,13}$"
                  title={t('org.form.taxCodeHint')}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={lookingUp || !form.taxCode || form.taxCode.length < TAX_CODE_MIN_LENGTH}
                  className="shrink-0 rounded-[var(--radius-button)] border border-primary bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
                >
                  {lookingUp ? t('org.form.lookingUp') : t('org.form.lookup')}
                </button>
              </div>
              {lookupError && <span className="field-hint text-danger">{lookupError}</span>}
            </div>
          )}

          {/* Legal Name */}
          <div className="space-y-1.5">
            <label htmlFor="edit-legalName" className="field-label">
              {organization.isJointVenture ? t('org.jvLegalName') : t('org.legalName')}
            </label>
            <input
              id="edit-legalName"
              name="legalName"
              value={form.legalName ?? ''}
              onChange={handleChange}
              placeholder={t('org.legalNamePlaceholder')}
              maxLength={300}
              className={inputClass}
            />
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label htmlFor="edit-displayName" className="field-label">
              {t('org.displayName')}
            </label>
            <input
              id="edit-displayName"
              name="displayName"
              value={form.displayName ?? ''}
              onChange={handleChange}
              placeholder={t('org.displayNamePlaceholder')}
              maxLength={300}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-internationalName" className="field-label">
              {t('org.internationalName')}
            </label>
            <input
              id="edit-internationalName"
              name="internationalName"
              value={form.internationalName ?? ''}
              onChange={handleChange}
              placeholder={t('org.internationalNamePlaceholder')}
              maxLength={300}
              className={inputClass}
            />
          </div>

          {/* --- Joint Venture Fields --- */}
          {organization.isJointVenture && (
            <div className="sm:col-span-2 rounded-[var(--radius-card)] border border-primary/20 bg-primary/5 p-5 space-y-4 mt-2">
              <h3 className="heading-label text-primary">{t('org.form.jvStructure')}</h3>
              <div className="flex flex-col gap-6 mt-3 pt-4 border-t border-primary/20">
                <div className="space-y-2">
                  <label className="field-label">
                    {t('org.form.jvMembers')} <span className="text-danger">*</span>
                  </label>
                  <div className="space-y-3 relative">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          const newId = e.target.value;
                          setForm(prev => ({
                            ...prev,
                            jointVentureMemberIds: prev.jointVentureMemberIds?.includes(newId)
                              ? prev.jointVentureMemberIds
                              : [...(prev.jointVentureMemberIds || []), newId]
                          }));
                        }
                      }}
                      className={inputClass}
                    >
                      <option value="">{t('org.form.addJvPartner')}</option>
                      {organizations.filter(o => !form.jointVentureMemberIds?.includes(o.id)).map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.displayName || org.legalName}
                        </option>
                      ))}
                    </select>
                    
                    {form.jointVentureMemberIds && form.jointVentureMemberIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.jointVentureMemberIds.map((orgId) => {
                          const org = organizations.find((o) => o.id === orgId);
                          return (
                            <span
                              key={orgId}
                              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/20"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              {org?.displayName || org?.legalName || 'Unknown'}
                              <button
                                type="button"
                                onClick={() => {
                                  setForm((prev) => {
                                    const newMembers = prev.jointVentureMemberIds?.filter((id) => id !== orgId);
                                    const newRep = prev.representativeOrganizationId === orgId ? '' : prev.representativeOrganizationId;
                                    return { ...prev, jointVentureMemberIds: newMembers, representativeOrganizationId: newRep };
                                  });
                                }}
                                className="text-primary hover:text-danger ml-1 focus:outline-none"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="field-label">
                    {t('org.form.jvLeadUnit')} <span className="text-danger">*</span>
                  </label>
                  <select
                    value={form.representativeOrganizationId || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, representativeOrganizationId: e.target.value }))}
                    required={organization.isJointVenture}
                    className={inputClass}
                  >
                    <option value="">{t('org.form.selectLeadUnit')}</option>
                    {(form.jointVentureMemberIds || []).map((orgId) => {
                      const org = organizations.find((o) => o.id === orgId);
                      return (
                        <option key={orgId} value={orgId}>
                          {org?.displayName || org?.legalName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Address */}
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="edit-address" className="field-label">
              {t('org.address')}
            </label>
            <input
              id="edit-address"
              name="address"
              value={form.address ?? ''}
              onChange={handleChange}
              placeholder={t('org.addressPlaceholder')}
              maxLength={300}
              className={inputClass}
            />
          </div>

          <p className="field-hint sm:col-span-2">{t('org.lookup.noContact')}</p>

          {/* Organization Type — dropdown hoặc input tại chỗ */}
          <div className={`space-y-1.5 ${organization.isJointVenture ? 'sm:col-span-2' : ''}`}>
            <label htmlFor="edit-orgType" className="field-label">
              {t('org.type')}
            </label>
            {!isOtherType ? (
              <select
                id="edit-orgType"
                value={form.organizationTypeId ?? ''}
                onChange={handleTypeSelect}
                className={inputClass}
              >
                <option value="">{t('org.selectType')}</option>
                {orgTypes.filter((ot) => ot.isActive).map((ot) => (
                  <option key={ot.id} value={ot.id}>{ot.name}</option>
                ))}
                {onCreateOrgType && (
                  <option value={OTHER_VALUE}>{t('org.typeOther')}</option>
                )}
              </select>
            ) : (
              <div className="relative">
                <input
                  id="edit-orgType"
                  value={customTypeName}
                  onChange={(e) => setCustomTypeName(e.target.value)}
                  placeholder={t('org.typeOtherPlaceholder')}
                  required
                  maxLength={200}
                  autoFocus
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleBackToSelect}
                  title={t('org.form.backToList')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted transition-colors hover:text-danger"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="edit-phone" className="field-label">
              {t('org.phone')}
            </label>
            <input
              id="edit-phone"
              name="phone"
              type="tel"
              value={form.phone ?? ''}
              onChange={handleChange}
              placeholder={t('org.phonePlaceholder')}
              maxLength={11}
              pattern="^\d{10,11}$"
              title={t('org.form.phoneHint')}
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="edit-email" className="field-label">
              {t('org.email')}
            </label>
            <input
              id="edit-email"
              name="email"
              type="email"
              value={form.email ?? ''}
              onChange={handleChange}
              placeholder={t('org.emailPlaceholder')}
              className={inputClass}
            />
          </div>
        </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-card-border pt-5">
          <button
            type="button"
            onClick={onCancel}
            className="btn-modal-ghost"
          >
            {t('account.cancel')}
          </button>
          
            <button
              type="submit"
              disabled={submitting}
              className="btn-modal-primary flex items-center gap-2"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('account.save')}
                </span>
              ) : (
                t('org.form.finish')
              )}
            </button>
      </div>
    </form>
  );
}
