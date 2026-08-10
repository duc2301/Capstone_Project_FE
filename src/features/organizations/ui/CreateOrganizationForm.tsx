import { Fragment, useState, useEffect } from 'react';
import type { Organization, CreateOrganizationPayload } from '@/entities/organization';
import { lookupTaxCode, TAX_CODE_MAX_LENGTH, TAX_CODE_MIN_LENGTH } from '@/entities/organization';
import type { OrganizationType, CreateOrganizationTypePayload } from '@/entities/organization-type';
import { accountApi } from '@/entities/account';
import type { Account } from '@/entities/account';
import { getApiErrorMessage } from '@/shared/api';
import { UserAvatar } from '@/shared/components';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

const OTHER_VALUE = '__other__';

const STEP_LABEL_KEYS: TranslationKey[] = ['org.step.info', 'org.step.team'];

interface Props {
  mode: 'organization' | 'joint-venture';
  orgTypes: OrganizationType[];
  organizations?: Organization[];
  onSubmit: (payload: CreateOrganizationPayload, selectedAccountIds?: string[]) => Promise<void>;
  onCancel: () => void;
  onCreateOrgType?: (payload: CreateOrganizationTypePayload) => Promise<OrganizationType | null>;
}

export function CreateOrganizationForm({ mode, orgTypes, organizations = [], onSubmit, onCancel, onCreateOrgType }: Props) {
  const isJv = mode === 'joint-venture';

  const [step, setStep] = useState<1 | 2>(1);

  const [form, setForm] = useState<CreateOrganizationPayload>({
    taxCode: '',
    legalName: '',
    displayName: '',
    internationalName: '',
    organizationTypeId: '',
    address: '',
    phone: '',
    email: '',
    isJointVenture: isJv,
    jointVentureMemberIds: [],
    representativeOrganizationId: '',
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isOtherType, setIsOtherType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (step === 2 && accounts.length === 0) {
      accountApi.getAll().then(res => {
        if (res.data.isSuccess && res.data.result) {
          const availableAccounts = res.data.result.filter((a: Account) => !a.organizationId);
          setAccounts(availableAccounts);
        }
      });
    }
  }, [step, accounts.length]);

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
    setForm((prev) => ({ ...prev, organizationTypeId: '' }));
  };

  const validateStep1 = () => {
    if (!isJv && !form.taxCode) return false;
    if (!form.legalName) return false;
    if (!isOtherType && !form.organizationTypeId) return false;
    if (isOtherType && !customTypeName.trim()) return false;
    if (isJv && (!form.jointVentureMemberIds?.length || !form.representativeOrganizationId)) return false;
    return true;
  };

  const handleNext = () => {
    if (!validateStep1()) {
      setSubmitError(t('org.form.missingRequired'));
      return;
    }
    setSubmitError(null);
    setStep(2);
  };

  const submitForm = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      let finalPayload: CreateOrganizationPayload = {
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

      await onSubmit(finalPayload, selectedAccountIds);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, t('org.save.error')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (step === 1 && !isJv) {
      handleNext();
      return;
    }
    void submitForm();
  };

  const inputClass = 'field-input';
  const selectClass = 'field-select';

  const filteredAccounts = accounts.filter(acc => 
    acc.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    acc.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAccountSelection = (id: string) => {
    setSelectedAccountIds(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
      {/* --- STEP HEADER --- */}
      {!isJv && (
        <div className="shrink-0 border-b border-card-border px-8 pt-6 pb-7">
          <div className="flex items-start">
            {STEP_LABEL_KEYS.map((labelKey, i) => {
              const stepNumber = i + 1;
              const isActive = stepNumber === step;
              const isDone = stepNumber < step;
              const canJump = isDone;
              return (
                <Fragment key={labelKey}>
                  {i > 0 && (
                    <div className={`mt-4 h-0.5 min-w-4 flex-1 transition-colors duration-300 ${stepNumber <= step ? 'bg-primary' : 'bg-card-border'}`} />
                  )}
                  <button
                    type="button"
                    onClick={() => { if (canJump) setStep(stepNumber as 1 | 2); }}
                    disabled={!canJump && !isActive}
                    className={`flex w-28 shrink-0 flex-col items-center gap-2 ${canJump ? 'cursor-pointer' : isActive ? 'cursor-default' : 'cursor-not-allowed'}`}
                  >
                    <span className="relative">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                        isActive ? 'bg-primary text-white'
                          : isDone ? 'bg-primary/15 text-primary'
                            : 'bg-content-bg text-text-placeholder'
                      }`}>
                        {isDone ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : stepNumber}
                      </span>
                      {isActive && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-amber" />}
                    </span>
                    <span className={`text-center text-xs leading-tight transition-colors ${
                      isActive ? 'font-semibold text-text' : isDone ? 'text-primary' : 'text-text-muted'
                    }`}>{t(labelKey)}</span>
                  </button>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}

      <div className="admin-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto px-8 py-6">
      {/* --- STEP 1: ORGANIZATION DETAILS --- */}
      {step === 1 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Tax Code - Hidden for Joint Ventures */}
          {!isJv && (
            <div className="space-y-1.5">
              <label htmlFor="create-taxCode" className="field-label">
                {t('org.taxCode')} <span className="text-danger">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="create-taxCode"
                  name="taxCode"
                  value={form.taxCode}
                  onChange={handleChange}
                  onBlur={() => {
                    if ((form.taxCode?.length ?? 0) >= TAX_CODE_MIN_LENGTH && !form.legalName) handleLookup();
                  }}
                  placeholder={t('org.taxCodePlaceholder')}
                  required={!isJv}
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
            <label htmlFor="create-legalName" className="field-label">
              {isJv ? t('org.jvLegalName') : t('org.legalName')} <span className="text-danger">*</span>
            </label>
            <input
              id="create-legalName"
              name="legalName"
              value={form.legalName}
              onChange={handleChange}
              placeholder={t('org.legalNamePlaceholder')}
              required
              maxLength={300}
              className={inputClass}
            />
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label htmlFor="create-displayName" className="field-label">
              {t('org.displayName')}
            </label>
            <input
              id="create-displayName"
              name="displayName"
              value={form.displayName ?? ''}
              onChange={handleChange}
              placeholder={t('org.displayNamePlaceholder')}
              maxLength={300}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="create-internationalName" className="field-label">
              {t('org.internationalName')}
            </label>
            <input
              id="create-internationalName"
              name="internationalName"
              value={form.internationalName ?? ''}
              onChange={handleChange}
              placeholder={t('org.internationalNamePlaceholder')}
              maxLength={300}
              className={inputClass}
            />
          </div>

          {/* --- Joint Venture Fields --- */}
          {isJv && (
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
                      className={selectClass}
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
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                              {org?.displayName || org?.legalName || t('org.form.unknownPartner')}
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
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
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
                    required={isJv}
                    className={selectClass}
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
            <label htmlFor="create-address" className="field-label">
              {t('org.address')}
            </label>
            <input
              id="create-address"
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
          <div className="space-y-1.5">
            <label htmlFor="create-orgType" className="field-label">
              {t('org.type')} <span className="text-danger">*</span>
            </label>
            {!isOtherType ? (
              <select
                id="create-orgType"
                value={form.organizationTypeId}
                onChange={handleTypeSelect}
                required
                className={selectClass}
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
                  id="create-orgType"
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
            <label htmlFor="create-phone" className="field-label">
              {t('org.phone')}
            </label>
            <input
              id="create-phone"
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
            <label htmlFor="create-email" className="field-label">
              {t('org.email')}
            </label>
            <input
              id="create-email"
              name="email"
              type="email"
              value={form.email ?? ''}
              onChange={handleChange}
              placeholder={t('org.emailPlaceholder')}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* --- STEP 2: TEAM SETUP --- */}
      {step === 2 && !isJv && (
        <div className="space-y-4">
          <div>
            <h3 className="heading-card text-text">{t('org.team.title')}</h3>
            <p className="field-hint mt-0.5">{t('org.team.desc')}</p>
          </div>

          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('org.team.search')}
              className="field-input pl-9"
            />
          </div>

          <div className="overflow-hidden rounded-[var(--radius-card)] border border-card-border">
            <div className="admin-scrollbar max-h-[300px] overflow-y-auto">
              {filteredAccounts.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-muted">
                  {t('org.team.empty')}
                </div>
              ) : (
                <div className="divide-y divide-card-border">
                  {filteredAccounts.map(account => {
                    const isSelected = selectedAccountIds.includes(account.id);
                    return (
                      <button
                        key={account.id}
                        type="button"
                        onClick={() => toggleAccountSelection(account.id)}
                        className={`flex w-full items-center gap-3 p-3 text-left transition-colors ${isSelected ? 'bg-primary-ghost' : 'hover:bg-input-bg'}`}
                      >
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isSelected ? 'border-primary bg-primary' : 'border-input-border bg-card'}`}>
                          {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12" /></svg>}
                        </span>
                        <UserAvatar userName={account.userName} avatarUrl={account.avatarUrl} size="md" rounded="full" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-text">{account.userName}</span>
                          <span className="block truncate text-xs text-text-muted">{account.email}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 text-sm font-medium text-text-muted">
            {t('org.team.selected')}: <span className="font-bold text-primary">{selectedAccountIds.length}</span> {t('org.team.selectedUnit')}
          </div>
        </div>
      )}
      </div>

      {submitError && (
        <p className="shrink-0 border-t border-danger/30 bg-danger-light px-8 py-3 text-sm font-medium text-danger">
          {submitError}
        </p>
      )}

      {/* Actions */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-card-border bg-card px-8 py-5">
        <div>
          {step === 2 && !isJv && (
            <button type="button" onClick={() => setStep(1)} className="btn-modal-ghost">
              {t('org.form.back')}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="btn-modal-ghost">
            {t('account.cancel')}
          </button>

          {step === 1 && !isJv ? (
            <button
              key="next"
              type="button"
              onClick={handleNext}
              className="btn-modal-primary flex items-center gap-2"
            >
              {t('org.form.next')}
            </button>
          ) : (
            <button
              key="submit"
              type="button"
              onClick={() => { if (!submitting) void submitForm(); }}
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
          )}
        </div>
      </div>
    </form>
  );
}
