import { useState, useEffect } from 'react';
import type { Organization, CreateOrganizationPayload } from '@/entities/organization';
import type { OrganizationType, CreateOrganizationTypePayload } from '@/entities/organization-type';
import { accountApi } from '@/entities/account/api/accountApi';
import type { Account } from '@/entities/account';
import { t } from '@/shared/lib/i18n';

const OTHER_VALUE = '__other__';

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
  
  // Wizard state
  const [step, setStep] = useState<1 | 2>(1);

  // Form state
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
  
  // Team Setup state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [isOtherType, setIsOtherType] = useState(false);
  const [customTypeName, setCustomTypeName] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  // Fetch accounts for step 2
  useEffect(() => {
    if (step === 2 && accounts.length === 0) {
      accountApi.getAll().then(res => {
        if (res.data.isSuccess && res.data.result) {
          // Exclude accounts that already belong to an organization (optional, but logical)
          const availableAccounts = res.data.result.filter((a: Account) => !a.organizationId);
          setAccounts(availableAccounts);
        }
      });
    }
  }, [step, accounts.length]);

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

  const validateStep1 = () => {
    if (!isJv && !form.taxCode) return false;
    if (!form.legalName) return false;
    if (!isOtherType && !form.organizationTypeId) return false;
    if (isOtherType && !customTypeName.trim()) return false;
    if (isJv && (!form.jointVentureMemberIds?.length || !form.representativeOrganizationId)) return false;
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    } else {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !isJv) {
      // Allow saving directly from step 1 or force to step 2?
      // Since design has step 2, if they submit here, we just save without team members.
    }
    
    setSubmitting(true);
    try {
      let finalPayload: any = { ...form };
      if (!finalPayload.taxCode) finalPayload.taxCode = undefined;
      if (!finalPayload.displayName) finalPayload.displayName = undefined;
      if (!finalPayload.address) finalPayload.address = undefined;
      if (!finalPayload.phone) finalPayload.phone = undefined;
      if (!finalPayload.email) finalPayload.email = undefined;
      if (!finalPayload.representativeOrganizationId) finalPayload.representativeOrganizationId = undefined;

      if (isOtherType && customTypeName.trim() && onCreateOrgType) {
        const code = customTypeName.trim().replace(/\s+/g, '');
        const created = await onCreateOrgType({ code, name: customTypeName.trim() });
        if (!created) {
          alert('Tạo loại tổ chức thất bại. Vui lòng thử lại.');
          return;
        }
        finalPayload = { ...finalPayload, organizationTypeId: created.id };
      }

      await onSubmit(finalPayload, selectedAccountIds);
    } catch (error: any) {
      console.error(error);
      let errorMsg = error.response?.data?.message;
      if (!errorMsg && error.response?.data?.errors) {
        const errors = error.response.data.errors as Record<string, string[]>;
        errorMsg = Object.values(errors).flat().join('\n');
      }
      if (!errorMsg && error.response?.data) {
        errorMsg = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
      }
      alert(errorMsg || 'Có lỗi xảy ra khi lưu. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';

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
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* --- STEP HEADER --- */}
      {!isJv && (
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-card-border">
          <div className="flex items-center gap-2">
             <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-[13px] ${step === 1 ? 'bg-primary text-white' : 'bg-primary/20 text-primary'}`}>
                1
             </div>
             <span className={`text-[14px] font-semibold ${step === 1 ? 'text-primary' : 'text-text-muted'}`}>Thiết lập Doanh nghiệp</span>
          </div>
          <div className="h-0.5 w-16 bg-card-border"></div>
          <div className="flex items-center gap-2">
             <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-[13px] ${step === 2 ? 'bg-primary text-white' : 'bg-input-border text-text-placeholder'}`}>
                2
             </div>
             <span className={`text-[14px] font-semibold ${step === 2 ? 'text-primary' : 'text-text-muted'}`}>Thiết lập đội ngũ</span>
          </div>
        </div>
      )}

      {/* --- STEP 1: ORGANIZATION DETAILS --- */}
      {step === 1 && (
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
                  required={!isJv}
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
      )}

      {/* --- STEP 2: TEAM SETUP --- */}
      {step === 2 && !isJv && (
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-text text-[15px]">Chọn thành viên</h3>
                <p className="text-[13px] text-text-muted mt-0.5">Thêm thành viên vào doanh nghiệp để cùng quản lý dự án.</p>
              </div>
           </div>

           <div className="relative">
             <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
             <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Tìm theo tên hoặc email..."
               className="w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg pl-9 pr-4 py-2.5 text-[13px] text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
             />
           </div>

           <div className="mt-4 border border-card-border rounded-[16px] overflow-hidden">
              <div className="max-h-[300px] overflow-y-auto">
                 {filteredAccounts.length === 0 ? (
                    <div className="p-8 text-center text-[13px] text-text-muted">
                      Không tìm thấy thành viên nào.
                    </div>
                 ) : (
                    <div className="divide-y divide-card-border">
                       {filteredAccounts.map(account => {
                          const isSelected = selectedAccountIds.includes(account.id);
                          return (
                             <div 
                                key={account.id} 
                                onClick={() => toggleAccountSelection(account.id)}
                                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-input-bg'}`}
                             >
                                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isSelected ? 'bg-primary border-primary' : 'border-input-border bg-card'}`}>
                                   {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-input-bg text-primary font-bold text-[12px] overflow-hidden">
                                   {account.avatarUrl ? <img src={account.avatarUrl} alt={account.userName} className="h-full w-full object-cover" /> : account.userName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                   <p className="text-[13px] font-bold text-text">{account.userName}</p>
                                   <p className="text-[12px] text-text-muted">{account.email}</p>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 )}
              </div>
           </div>
           
           <div className="pt-2 text-[13px] text-text-muted font-medium">
             Đã chọn: <span className="text-primary font-bold">{selectedAccountIds.length}</span> thành viên
           </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 border-t border-card-border pt-5">
        <div>
           {step === 2 && !isJv && (
             <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full border border-card-border bg-card px-6 py-2.5 text-[13px] font-semibold text-text-secondary transition-all duration-200 hover:bg-input-bg hover:text-text"
             >
                Quay lại
             </button>
           )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-card-border bg-card px-6 py-2.5 text-[13px] font-semibold text-text-secondary transition-all duration-200 hover:bg-input-bg hover:text-text"
          >
            {t('account.cancel')}
          </button>
          
          {step === 1 && !isJv ? (
             <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-full bg-[#647C54] px-6 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#526645]"
              >
                Tiếp tục
             </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full bg-[#647C54] px-6 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#526645] disabled:opacity-50 disabled:cursor-not-allowed"
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
                'Hoàn tất'
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
