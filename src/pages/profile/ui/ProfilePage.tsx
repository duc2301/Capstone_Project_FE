import { useState } from 'react';

import type { ChangePasswordPayload } from '@/entities/profile';
import { useProfile } from '@/features/profile';
import { t } from '@/shared/lib/i18n';

/* ── Tab config ────────────────────────────────────── */
type ProfileTab = 'info' | 'security' | 'notifications' | 'signature' | 'activity';

/* ── Helper: initials ──────────────────────────────── */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* ── Main page ─────────────────────────────────────── */
export function ProfilePage() {
  const { profile, loading: profileLoading, updateProfile, changePassword } = useProfile();
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  /* ── Editable fields ─────────────────────────────── */
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);

  /* ── Password fields ─────────────────────────────── */
  const [pwForm, setPwForm] = useState<ChangePasswordPayload>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [changingPw, setChangingPw] = useState(false);

  const userName = profile?.userName ?? 'Người dùng';
  const email = profile?.email ?? '';
  const role = profile?.role ?? 'Member';
  const initials = getInitials(userName);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const startEdit = () => {
    setEditName(profile?.userName ?? '');
    setEditEmail(profile?.email ?? '');
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        userName: editName || undefined,
        email: editEmail || undefined,
      });
      showToast(t('profile.update.success'), 'success');
      setEditMode(false);
    } catch {
      showToast(t('profile.update.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      showToast(t('profile.password.mismatch'), 'error');
      return;
    }
    setChangingPw(true);
    try {
      await changePassword(pwForm);
      showToast(t('profile.password.success'), 'success');
      setPwForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch {
      showToast(t('profile.password.error'), 'error');
    } finally {
      setChangingPw(false);
    }
  };

  const tabs = [
    { key: 'info' as const, label: t('profile.tabs.info') },
    { key: 'security' as const, label: t('profile.tabs.security') },
    { key: 'notifications' as const, label: 'Thông báo' },
    { key: 'signature' as const, label: 'Chữ ký số' },
    { key: 'activity' as const, label: 'Hoạt động' },
  ];

  const inputClass = 'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';
  const inputReadOnly = 'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none';

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-card-border bg-card py-20 shadow-card">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-text-muted">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Toast notification ─────────────────────── */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 animate-slide-up rounded-xl border px-5 py-3 shadow-dropdown ${toastType === 'success' ? 'border-success/30 bg-success-light' : 'border-danger/30 bg-danger-light'}`}>
          <p className={`text-sm font-medium ${toastType === 'success' ? 'text-success' : 'text-danger'}`}>{toastMessage}</p>
        </div>
      )}

      {/* ── Profile Header Card ────────────────────── */}
      <div className="rounded-[var(--radius-card-lg)] border border-card-border bg-card p-6 shadow-card lg:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-white shadow-sm">
                {initials}
              </div>
              <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-warning text-white shadow-sm hover:bg-warning-hover">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-text lg:text-3xl">
                {userName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-content-bg px-3 py-1.5 text-xs font-medium text-text-secondary">
                  {t('brand.name')}
                </span>
                <span className="inline-flex items-center rounded-full bg-[#C2E09B] px-3 py-1.5 text-xs font-medium text-primary">
                  {role}
                </span>
                <span className="inline-flex items-center rounded-full bg-[#DFE5D4] px-3 py-1.5 text-xs font-medium text-primary">
                  {profile?.status ?? t('profile.status.active')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────── */}
      <div className="flex overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`
              relative flex-1 py-4 text-center text-sm font-semibold transition-all duration-200
              ${activeTab === tab.key
                ? 'bg-content-bg text-primary'
                : 'text-text-muted hover:bg-content-bg/50 hover:text-text'
              }
            `}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left column (2/3) ────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {activeTab === 'info' && (
            <div className="rounded-[var(--radius-card-lg)] border border-card-border bg-card p-6 shadow-card lg:p-8">
              <div className="mb-6">
                <h2 className="font-heading text-lg font-bold text-text">{t('profile.personalInfo.title')}</h2>
                <p className="mt-1 text-sm text-text-muted">{t('profile.personalInfo.desc')}</p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Full name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">
                    {t('profile.personalInfo.fullName')}
                  </label>
                  {editMode ? (
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
                  ) : (
                    <input type="text" value={userName} readOnly className={inputReadOnly} />
                  )}
                </div>

                {/* Position */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">
                    {t('profile.personalInfo.position')}
                  </label>
                  <input type="text" value={role} readOnly className={inputReadOnly} />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">
                    {t('profile.personalInfo.email')}
                  </label>
                  {editMode ? (
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={inputClass} />
                  ) : (
                    <input type="email" value={email} readOnly className={inputReadOnly} />
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">
                    {t('profile.personalInfo.phone')}
                  </label>
                  <input type="tel" value="" readOnly placeholder="—" className={inputReadOnly + ' placeholder:text-text-placeholder'} />
                </div>

                {/* Company */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">
                    {t('profile.personalInfo.company')}
                  </label>
                  <input type="text" value="" readOnly placeholder="—" className={inputReadOnly + ' placeholder:text-text-placeholder'} />
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">
                    {t('profile.personalInfo.department')}
                  </label>
                  <input type="text" value="" readOnly placeholder="—" className={inputReadOnly + ' placeholder:text-text-placeholder'} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-card-border pt-5">
                {editMode ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-[var(--radius-button)] border border-card-border bg-card px-6 py-2.5 text-sm font-semibold text-text-secondary transition-all duration-200 hover:bg-content-bg"
                    >
                      {t('account.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover disabled:opacity-50"
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {t('common.saveChanges')}
                        </span>
                      ) : (
                        t('common.saveChanges')
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover"
                  >
                    {t('profile.editButton')}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="rounded-[var(--radius-card-lg)] border border-card-border bg-card p-6 shadow-card lg:p-8">
              <div className="mb-6">
                <h2 className="font-heading text-lg font-bold text-text">{t('profile.security.title')}</h2>
                <p className="mt-1 text-sm text-text-muted">{t('profile.security.desc')}</p>
              </div>

              <form onSubmit={handleChangePassword} className="max-w-md space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">
                    {t('profile.security.currentPassword')}
                  </label>
                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="••••••••"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">
                    {t('profile.security.newPassword')}
                  </label>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">
                    {t('profile.security.confirmPassword')}
                  </label>
                  <input
                    type="password"
                    value={pwForm.confirmNewPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                    placeholder="••••••••"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="border-t border-card-border pt-5">
                  <button
                    type="submit"
                    disabled={changingPw}
                    className="rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover disabled:opacity-50"
                  >
                    {changingPw ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t('profile.security.changePassword')}
                      </span>
                    ) : (
                      t('profile.security.changePassword')
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── Right column (1/3) ───────────────────── */}
        <div className="space-y-6">
          {/* Groups / Teams */}
          {profile && profile.groups.length > 0 && (
            <div className="rounded-[var(--radius-card-lg)] border border-card-border bg-card p-6 shadow-card">
              <h3 className="mb-4 font-heading text-base font-bold text-text">Nhóm tham gia</h3>
              <div className="space-y-3">
                {profile.groups.map((g) => (
                  <div key={g.groupId} className="flex items-center justify-between rounded-xl border border-card-border p-3 transition-colors hover:bg-content-bg">
                    <div>
                      <p className="text-sm font-semibold text-text">{g.groupName}</p>
                      {g.joinedAt && (
                        <p className="text-xs text-text-muted">Tham gia: {new Date(g.joinedAt).toLocaleDateString('vi-VN')}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center rounded-[var(--radius-badge)] px-2.5 py-1 text-xs font-semibold ${g.role === 'Leader' ? 'bg-warning-light text-warning' : 'bg-primary-light text-primary'}`}>
                      {g.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Stats */}
          <div className="rounded-[var(--radius-card-lg)] border border-card-border bg-card p-6 shadow-card">
            <h3 className="mb-4 font-heading text-base font-bold text-text">
              {t('profile.activity.title')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-card-border p-4 text-center transition-colors hover:bg-content-bg">
                <p className="text-2xl font-bold text-primary">{profile?.groups.length ?? 0}</p>
                <p className="mt-1 text-xs text-text-muted">{t('profile.activity.projects')}</p>
              </div>
              <div className="rounded-xl border border-card-border p-4 text-center transition-colors hover:bg-content-bg">
                <p className="text-2xl font-bold text-warning">—</p>
                <p className="mt-1 text-xs text-text-muted">{t('profile.activity.uploads')}</p>
              </div>
              <div className="rounded-xl border border-card-border p-4 text-center transition-colors hover:bg-content-bg">
                <p className="text-2xl font-bold text-info">—</p>
                <p className="mt-1 text-xs text-text-muted">{t('profile.activity.issues')}</p>
              </div>
              <div className="rounded-xl border border-card-border p-4 text-center transition-colors hover:bg-content-bg">
                <p className="text-2xl font-bold text-success">—</p>
                <p className="mt-1 text-xs text-text-muted">{t('profile.activity.progress')}</p>
              </div>
            </div>
          </div>

          {/* Verification card */}
          <div className="overflow-hidden rounded-[var(--radius-card-lg)] border border-success/20 bg-success-light shadow-card">
            <div className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <h3 className="font-heading text-sm font-bold text-success">
                  {t('profile.status.verified')}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-text-muted">
                {t('profile.status.verifiedDesc')}
              </p>
              <p className="mt-2 text-xs text-text-muted">
                Tạo ngày: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
