import { useState } from 'react';

import type { Organization, CreateOrganizationPayload } from '@/entities/organization';
import type { OrganizationType, CreateOrganizationTypePayload } from '@/entities/organization-type';
import { t } from '@/shared/lib/i18n';

const OTHER_VALUE = '__other__';

interface Props {
  mode: 'organization' | 'joint-venture';
  orgTypes: OrganizationType[];
  organizations?: Organization[];
  onSubmit: (payload: CreateOrganizationPayload) => Promise<void>;
  onCancel: () => void;
  onCreateOrgType?: (payload: CreateOrganizationTypePayload) => Promise<OrganizationType | null>;
}

export function CreateOrganizationForm({ mode, orgTypes, organizations = [], onSubmit, onCancel, onCreateOrgType }: Props) {
  const isJv = mode === 'joint-venture';
  const [form, setForm] = useState<CreateOrganizationPayload>({
    taxCode: '',
    legalName: '',
    displayName: '',
    organizationTypeId: '',
    address: '',
    phone: '',
    email: '',
    isJointVenture: isJv,
    jointVentureMemberIds: [],
    representativeOrganizationId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [isOtherType, setIsOtherType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');

  const [lookingUp, setLookingUp] = useState(false);

  const handleLookup = async () => {
    if (!form.taxCode || form.taxCode.length < 10) return;
    setLookingUp(true);
    try {
      const response = await fetch(`https://api.vietqr.io/v2/business/${form.taxCode}`);
      const result = await response.json();
      if (result.code === '00' && result.data) {
        setForm((prev) => ({
          ...prev,
          legalName: result.data.name || prev.legalName,
          displayName: result.data.shortName || result.data.name || prev.displayName,
          address: result.data.address || prev.address,
          phone: result.data.phone || prev.phone,
          email: result.data.email || prev.email,
        }));
      } else {
        alert('Không tìm thấy doanh nghiệp với mã số thuế này.');
      }
    } catch {
      alert('Không thể kết nối dịch vụ tra cứu MST. Bạn có thể nhập thủ công.');
    } finally {
      setLookingUp(false);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalPayload = { ...form };

      if (isOtherType && customTypeName.trim() && onCreateOrgType) {
        const code = customTypeName.trim().replace(/\s+/g, '');
        const created = await onCreateOrgType({ code, name: customTypeName.trim() });
        if (!created) {
          alert('Tạo loại tổ chức thất bại. Vui lòng thử lại.');
          return;
        }
        finalPayload = { ...finalPayload, organizationTypeId: created.id };
      }

      await onSubmit(finalPayload);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Tax Code - Hidden for Joint Ventures */}
        {!isJv && (
          <div className="space-y-1.5">
            <label htmlFor="create-taxCode" className="block text-sm font-medium text-text-secondary">
              {t('org.taxCode')} <span className="text-danger">*</span>
            </label>
            <div className="flex gap-2">
              <input
                id="create-taxCode"
                name="taxCode"
                value={form.taxCode}
                onChange={handleChange}
                onBlur={() => {
                  if (form.taxCode.length >= 10 && !form.legalName) handleLookup();
                }}
                placeholder={t('org.taxCodePlaceholder')}
                required
                maxLength={13}
                pattern="^\d{10,13}$"
                title="Mã số thuế phải bao gồm từ 10 đến 13 chữ số"
                className={inputClass}
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookingUp || !form.taxCode || form.taxCode.length < 10}
                className="shrink-0 rounded-[var(--radius-button)] border border-primary bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-50"
              >
                {lookingUp ? 'Đang tìm...' : 'Tra cứu'}
              </button>
            </div>
          </div>
        )}

        {/* Legal Name */}
        <div className="space-y-1.5">
          <label htmlFor="create-legalName" className="block text-sm font-medium text-text-secondary">
            {isJv ? 'Tên liên danh' : t('org.legalName')} <span className="text-danger">*</span>
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
          <label htmlFor="create-displayName" className="block text-sm font-medium text-text-secondary">
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

        {/* Organization Type — dropdown hoặc input tại chỗ */}
        <div className={`space-y-1.5 ${isJv ? 'sm:col-span-2' : ''}`}>
          <label htmlFor="create-orgType" className="block text-sm font-medium text-text-secondary">
            {t('org.type')} <span className="text-danger">*</span>
          </label>
          {!isOtherType ? (
            <select
              id="create-orgType"
              value={form.organizationTypeId}
              onChange={handleTypeSelect}
              required
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
                title="Quay lại chọn từ danh sách"
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

        {/* --- Joint Venture Fields --- */}
        {isJv && (
          <div className="sm:col-span-2 rounded-[var(--radius-card)] border border-primary/20 bg-primary/5 p-5 space-y-4 mt-2">
            <h3 className="text-sm font-bold text-primary">Cấu trúc Liên danh</h3>
            <div className="flex flex-col gap-6 mt-3 pt-4 border-t border-primary/20">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-secondary">
                  Thành viên liên danh <span className="text-danger">*</span>
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
                    <option value="">+ Thêm đối tác vào liên danh...</option>
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
                <label className="block text-sm font-medium text-text-secondary">
                  Đơn vị đứng đầu (Đại diện) liên danh <span className="text-danger">*</span>
                </label>
                <select
                  value={form.representativeOrganizationId || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, representativeOrganizationId: e.target.value }))}
                  required={isJv}
                  className={inputClass}
                >
                  <option value=""> Chọn đơn vị đại diện </option>
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
          <label htmlFor="create-address" className="block text-sm font-medium text-text-secondary">
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

        {/* Phone */}
        <div className="space-y-1.5">
          <label htmlFor="create-phone" className="block text-sm font-medium text-text-secondary">
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
            title="Số điện thoại phải bao gồm từ 10 đến 11 chữ số"
            className={inputClass}
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="create-email" className="block text-sm font-medium text-text-secondary">
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

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-card-border pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[var(--radius-button)] border border-card-border bg-card px-6 py-2.5 text-sm font-semibold text-text-secondary transition-all duration-200 hover:bg-content-bg hover:border-text-muted"
        >
          {t('account.cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
            t('account.save')
          )}
        </button>
      </div>
    </form>
  );
}
