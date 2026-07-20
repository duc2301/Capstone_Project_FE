import { useState } from 'react';

import { namingConventionApi } from '@/entities/naming-convention';
import { t } from '@/shared/lib/i18n';

import { useNamingConventions } from '../model/useNamingConventions';
import { ConventionDetail } from './ConventionDetail';
import { CreateConventionModal } from './CreateConventionModal';

interface NamingConventionSettingsProps {
  projectId: string;
  /** Admin/PM = true (CRUD + áp dụng). Leader = false (xem + tùy chỉnh trường theo folder). */
  canConfigure: boolean;
}

const cardClass = 'rounded-[24px] border border-card-border/60 bg-card/70 p-8 shadow-card backdrop-blur-sm';

/* Tab "Cài đặt" của dự án — quản lý các bộ quy tắc đặt tên tệp (kiểu Autodesk Docs):
 * danh sách → chi tiết (fields/values/khóa/gán thư mục), tạo mới bằng import xlsx hoặc tay. */
export function NamingConventionSettings({ projectId, canConfigure }: NamingConventionSettingsProps) {
  const { conventions, loading, error, refetch, upsert } = useNamingConventions(projectId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const selected = conventions.find((c) => c.id === selectedId) ?? null;

  const handleDownloadTemplate = async () => {
    try {
      const res = await namingConventionApi.downloadTemplate();
      const blobUrl = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'naming-convention-template_ISO-19650.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      showToast(t('common.error'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-20 right-6 z-[60] animate-slide-up rounded-xl border px-5 py-3 shadow-dropdown ${toast.type === 'success' ? 'border-success/30 bg-success-light' : 'border-danger/30 bg-danger-light'}`}>
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-success' : 'text-danger'}`}>{toast.msg}</p>
        </div>
      )}

      {selected ? (
        <ConventionDetail
          convention={selected}
          projectId={projectId}
          canConfigure={canConfigure}
          onBack={() => setSelectedId(null)}
          onMutated={upsert}
          onDeleted={() => setSelectedId(null)}
          refetch={refetch}
          showToast={showToast}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-primary">{t('naming.title')}</h2>
              <p className="mt-1 text-sm text-text-muted">
                {canConfigure ? t('naming.subtitle') : t('naming.leader.subtitle')}
              </p>
            </div>
            {canConfigure && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleDownloadTemplate()}
                  className="flex items-center gap-2 rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {t('naming.downloadTemplate')}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  {t('naming.create')}
                </button>
              </div>
            )}
          </div>

          {/* Danh sách */}
          {loading ? (
            <div className="flex items-center justify-center rounded-[24px] border border-card-border/60 bg-card/70 py-20 shadow-card">
              <p className="text-sm text-text-muted">{t('common.loading')}</p>
            </div>
          ) : error ? (
            <div className="rounded-[24px] border border-danger/20 bg-danger-light p-6 text-center">
              <p className="text-sm font-medium text-danger">{error}</p>
            </div>
          ) : conventions.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-card-border bg-card/70 p-16 text-center shadow-card">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                  <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
                </svg>
              </span>
              <p className="font-display text-lg font-semibold text-text">{t('naming.empty.title')}</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">{t('naming.empty.desc')}</p>
              {canConfigure && (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="mx-auto mt-5 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  {t('naming.create')}
                </button>
              )}
            </div>
          ) : (
            <div className={`${cardClass} overflow-x-auto`}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-card-border text-text-muted">
                    <th className="pb-3 font-semibold">{t('naming.table.name')}</th>
                    <th className="pb-3 text-center font-semibold">{t('naming.table.delimiter')}</th>
                    <th className="pb-3 text-center font-semibold">{t('naming.table.fields')}</th>
                    <th className="pb-3 font-semibold">{t('naming.table.folders')}</th>
                    <th className="pb-3 text-center font-semibold">{t('naming.table.status')}</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border text-text">
                  {conventions.map((c) => {
                    const sortedCodes = [...c.fields].sort((a, b) => a.orderIndex - b.orderIndex).map((f) => f.code);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className="cursor-pointer transition-colors hover:bg-content-bg"
                      >
                        <td className="py-4 pr-4">
                          <p className="font-medium text-primary">{c.name}</p>
                          <p className="mt-0.5 truncate font-mono text-xs text-text-muted">
                            {sortedCodes.join(c.delimiter)}
                          </p>
                        </td>
                        <td className="py-4 text-center">
                          <span className="rounded-full bg-content-bg px-2.5 py-1 font-mono text-xs font-bold text-text-secondary">{c.delimiter}</span>
                        </td>
                        <td className="py-4 text-center font-semibold">{c.fields.length}</td>
                        <td className="max-w-56 py-4 pr-4">
                          {c.assignedFolders.length === 0 ? (
                            <span className="text-xs text-text-muted">—</span>
                          ) : (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-bold text-primary">
                                {c.assignedFolders.length} {t('naming.foldersUnit')}
                              </span>
                              {c.assignedFolders.slice(0, 2).map((f) => (
                                <span key={f.id} className="rounded-full bg-content-bg px-2 py-0.5 text-xs font-semibold text-text-secondary">{f.name}</span>
                              ))}
                              {c.assignedFolders.length > 2 && (
                                <span className="text-xs font-semibold text-text-muted">+{c.assignedFolders.length - 2}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.isActive ? 'bg-success-light text-success' : 'bg-content-bg text-text-muted'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${c.isActive ? 'bg-success' : 'bg-text-placeholder'}`} />
                            {c.isActive ? t('naming.status.active') : t('naming.status.inactive')}
                          </span>
                        </td>
                        <td className="py-4 text-right text-text-muted">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto"><polyline points="9 18 15 12 9 6" /></svg>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {createOpen && (
        <CreateConventionModal
          projectId={projectId}
          onClose={() => setCreateOpen(false)}
          onCreated={(conv) => {
            upsert(conv);
            setCreateOpen(false);
            setSelectedId(conv.id);
            showToast(t('naming.toast.created'));
          }}
        />
      )}
    </div>
  );
}
