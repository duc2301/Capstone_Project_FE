import { useRef, useState } from 'react';

import type { ChangePasswordPayload, ProfileGroup } from '@/entities/profile';
import { AuditLogPanel } from '@/features/audit-logs';
import { useProfile } from '@/features/profile';
import { Toast, UserAvatar, useToast } from '@/shared/components';
import { formatDate } from '@/shared/lib/format';
import { useUrlTab } from '@/shared/lib/url';
import { t } from '@/shared/lib/i18n';

type ProfileTab = 'info' | 'security' | 'activity';
const PROFILE_TABS = ['info', 'security', 'activity'] as const;

const MAX_AVATAR_BYTES = 6 * 1024 * 1024;

export function ProfilePage() {
  const { profile, loading: profileLoading, updateProfile, changePassword, uploadAvatar } = useProfile();
  const [activeTab, setActiveTab] = useUrlTab(PROFILE_TABS, 'info');
  const { toast, showToast } = useToast();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState<ChangePasswordPayload>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [changingPw, setChangingPw] = useState(false);

  const userName = profile?.userName ?? '';
  const email = profile?.email ?? '';

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: 'info', label: t('profile.tabs.info') },
    { key: 'security', label: t('profile.tabs.security') },
    { key: 'activity', label: t('profile.tabs.activity') },
  ];

  const startEdit = () => {
    setEditName(profile?.userName ?? '');
    setEditEmail(profile?.email ?? '');
    setEditMode(true);
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

  const handleAvatarPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      showToast(t('profile.avatar.tooLarge'), 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      showToast(t('profile.avatar.success'), 'success');
    } catch {
      showToast(t('profile.avatar.error'), 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-[var(--radius-card)] border border-card-border bg-card shadow-card">
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <Toast toast={toast} className="z-50" />

      <div className="shrink-0 rounded-[var(--radius-card-lg)] border border-card-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-5">
          <div className="relative">
            <UserAvatar
              userName={userName}
              avatarUrl={profile?.avatarUrl}
              size="xl"
              rounded="full"
              className="shadow-sm"
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarPicked}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              title={t('profile.avatar.change')}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          </div>

          <div className="min-w-0">
            <h1 className="heading-page truncate">{userName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-content-bg px-3 py-1.5 text-xs font-medium text-text-secondary">
                {profile?.organizationName ?? t('profile.personalInfo.noCompany')}
              </span>
              {profile?.role && (
                <span className="inline-flex items-center rounded-full bg-primary-tint-strong px-3 py-1.5 text-xs font-medium text-primary">
                  {profile.role}
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-sage-tint px-3 py-1.5 text-xs font-medium text-primary">
                {profile?.status ?? t('profile.status.active')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-8 border-b border-card-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative pb-3 text-sm font-semibold transition-colors ${
              activeTab === tab.key ? 'text-primary' : 'text-text-muted hover:text-text'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-t-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'activity' ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AuditLogPanel mode="me" />
        </div>
      ) : (
        <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto pb-2">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {activeTab === 'info' ? (
                <div className="rounded-[var(--radius-card-lg)] border border-card-border bg-card p-6 shadow-card">
                  <h2 className="heading-entity mb-6">{t('profile.personalInfo.title')}</h2>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="field-label">{t('profile.personalInfo.fullName')}</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="field-input"
                        />
                      ) : (
                        <input type="text" value={userName} readOnly className="field-input-readonly" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="field-label">{t('profile.personalInfo.email')}</label>
                      {editMode ? (
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="field-input"
                        />
                      ) : (
                        <input type="email" value={email} readOnly className="field-input-readonly" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="field-label">{t('profile.personalInfo.company')}</label>
                      <input
                        type="text"
                        value={profile?.organizationName ?? ''}
                        readOnly
                        placeholder={t('profile.personalInfo.noCompany')}
                        className="field-input-readonly placeholder:text-text-placeholder"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="field-label">{t('profile.createdAt')}</label>
                      <input
                        type="text"
                        value={profile?.createdAt ? formatDate(profile.createdAt) : ''}
                        readOnly
                        placeholder="—"
                        className="field-input-readonly placeholder:text-text-placeholder"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3 border-t border-card-border pt-5">
                    {editMode ? (
                      <>
                        <button type="button" onClick={() => setEditMode(false)} className="btn-modal-ghost">
                          {t('account.cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="btn-modal-primary disabled:opacity-50"
                        >
                          {t('common.saveChanges')}
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={startEdit} className="btn-modal-primary">
                        {t('profile.editButton')}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-[var(--radius-card-lg)] border border-card-border bg-card p-6 shadow-card">
                  <h2 className="heading-entity mb-6">{t('profile.security.title')}</h2>

                  <form onSubmit={handleChangePassword} className="max-w-md space-y-5">
                    <div className="space-y-1.5">
                      <label className="field-label">{t('profile.security.currentPassword')}</label>
                      <input
                        type="password"
                        value={pwForm.currentPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                        required
                        className="field-input"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="field-label">{t('profile.security.newPassword')}</label>
                      <input
                        type="password"
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                        required
                        minLength={6}
                        className="field-input"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="field-label">{t('profile.security.confirmPassword')}</label>
                      <input
                        type="password"
                        value={pwForm.confirmNewPassword}
                        onChange={(e) => setPwForm((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                        required
                        className="field-input"
                      />
                    </div>

                    <div className="border-t border-card-border pt-5">
                      <button type="submit" disabled={changingPw} className="btn-modal-primary disabled:opacity-50">
                        {t('profile.security.changePassword')}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-[var(--radius-card-lg)] border border-card-border bg-card p-6 shadow-card">
                <h3 className="heading-card mb-4">{t('profile.groups')}</h3>

                {profile && profile.groups.length > 0 ? (
                  <div className="space-y-3">
                    {profile.groups.map((group) => (
                      <GroupRow key={group.groupId} group={group} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">{t('profile.groups.empty')}</p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupRow({ group }: { group: ProfileGroup }) {
  const isLeader = group.role === 'Leader';

  return (
    <div className="rounded-[var(--radius-card)] border border-card-border p-3 transition-colors hover:bg-content-bg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="heading-label truncate">{group.groupName}</p>
          {group.organizationName && <p className="field-hint truncate">{group.organizationName}</p>}
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
            isLeader ? 'bg-warning-light text-warning' : 'bg-primary-light text-primary'
          }`}
        >
          {group.role}
        </span>
      </div>

      {group.joinedAt && (
        <p className="field-hint mt-2">
          {t('profile.groups.joinedAt')}: {formatDate(group.joinedAt)}
        </p>
      )}

      {group.projects.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {group.projects.map((project) => (
            <span
              key={project.projectId}
              className="inline-flex max-w-full items-center truncate rounded-full bg-primary-ghost px-2.5 py-1 text-2xs font-medium text-primary"
            >
              {project.projectName}
            </span>
          ))}
        </div>
      ) : (
        <p className="field-hint mt-2">{t('profile.groups.noProject')}</p>
      )}
    </div>
  );
}

