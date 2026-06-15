import { useState } from 'react';

import type { Organization, UpdateOrganizationPayload } from '@/entities/organization';
import type { OrganizationType, CreateOrganizationTypePayload } from '@/entities/organization-type';
import { t } from '@/shared/lib/i18n';

const OTHER_VALUE = '__other__';

interface Props {
  organization: Organization;
  orgTypes: OrganizationType[];
  onSubmit: (id: string, payload: UpdateOrganizationPayload) => Promise<void>;
  onCancel: () => void;
  onCreateOrgType?: (payload: CreateOrganizationTypePayload) => Promise<OrganizationType | null>;
}

export function UpdateOrganizationForm({ organization, orgTypes, onSubmit, onCancel, onCreateOrgType }: Props) {
  const [form, setForm] = useState<UpdateOrganizationPayload>({
    taxCode: organization.taxCode,
    legalName: organization.legalName,
    displayName: organization.displayName ?? '',
    organizationTypeId: organization.organizationTypeId,
    address: organization.address ?? '',
    phone: organization.phone ?? '',
    email: organization.email ?? '',
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
    setForm((prev) => ({ ...prev, organizationTypeId: organization.organizationTypeId }));
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

      await onSubmit(organization.id, finalPayload);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Tax Code */}
        <div className="space-y-1.5">
          <label htmlFor="edit-taxCode" className="block text-sm font-medium text-text-secondary">
            {t('org.taxCode')}
          </label>
          <div className="flex gap-2">
            <input
              id="edit-taxCode"
              name="taxCode"
              value={form.taxCode ?? ''}
              onChange={handleChange}
              placeholder={t('org.taxCodePlaceholder')}
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

        {/* Legal Name */}
        <div className="space-y-1.5">
          <label htmlFor="edit-legalName" className="block text-sm font-medium text-text-secondary">
            {t('org.legalName')}
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
          <label htmlFor="edit-displayName" className="block text-sm font-medium text-text-secondary">
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

        {/* Organization Type — dropdown hoặc input tại chỗ */}
        <div className="space-y-1.5">
          <label htmlFor="edit-orgType" className="block text-sm font-medium text-text-secondary">
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

        {/* Address */}
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="edit-address" className="block text-sm font-medium text-text-secondary">
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

        {/* Phone */}
        <div className="space-y-1.5">
          <label htmlFor="edit-phone" className="block text-sm font-medium text-text-secondary">
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
            title="Số điện thoại phải bao gồm từ 10 đến 11 chữ số"
            className={inputClass}
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="edit-email" className="block text-sm font-medium text-text-secondary">
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
