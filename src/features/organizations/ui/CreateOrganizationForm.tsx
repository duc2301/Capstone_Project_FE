import { useState } from 'react';

import type { CreateOrganizationPayload } from '@/entities/organization';
import type { OrganizationType } from '@/entities/organization-type';
import { t } from '@/shared/lib/i18n';

interface Props {
  orgTypes: OrganizationType[];
  onSubmit: (payload: CreateOrganizationPayload) => Promise<void>;
  onCancel: () => void;
}

export function CreateOrganizationForm({ orgTypes, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CreateOrganizationPayload>({
    taxCode: '',
    legalName: '',
    displayName: '',
    organizationTypeId: '',
    address: '',
    phone: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);

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
    } catch (error) {
      alert('Không thể kết nối dịch vụ tra cứu MST. Bạn có thể nhập thủ công.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
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

        {/* Legal Name */}
        <div className="space-y-1.5">
          <label htmlFor="create-legalName" className="block text-sm font-medium text-text-secondary">
            {t('org.legalName')} <span className="text-danger">*</span>
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

        {/* Organization Type */}
        <div className="space-y-1.5">
          <label htmlFor="create-orgType" className="block text-sm font-medium text-text-secondary">
            {t('org.type')} <span className="text-danger">*</span>
          </label>
          <select
            id="create-orgType"
            name="organizationTypeId"
            value={form.organizationTypeId}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="">{t('org.selectType')}</option>
            {orgTypes.filter((ot) => ot.isActive).map((ot) => (
              <option key={ot.id} value={ot.id}>{ot.name}</option>
            ))}
          </select>
        </div>

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
