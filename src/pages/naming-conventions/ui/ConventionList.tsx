import type { NamingConvention } from '@/entities/naming-convention';
import { t } from '@/shared/lib/i18n';

interface ConventionListProps {
  conventions: NamingConvention[];
  onOpen: (conventionId: string) => void;
}

export function ConventionList({ conventions, onOpen }: Readonly<ConventionListProps>) {
  if (conventions.length === 0) {
    return (
      <div className="rounded-[var(--radius-card-lg)] border border-dashed border-card-border bg-card/70 px-6 py-10 text-center shadow-card">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
          </svg>
        </span>
        <p className="font-display text-base font-semibold text-text">{t('naming.empty.title')}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">{t('naming.empty.desc')}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card">
      <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
        <table className="table-list min-w-[760px] text-left">
          <colgroup>
            <col />
            <col className="w-[120px]" />
            <col className="w-[110px]" />
            <col className="w-[34%]" />
            <col className="w-[150px]" />
            <col className="w-[50px]" />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="table-head bg-content-bg">
              <th className="px-6 py-3.5">{t('naming.table.name')}</th>
              <th className="px-5 py-3.5 text-center">{t('naming.table.delimiter')}</th>
              <th className="px-5 py-3.5 text-center">{t('naming.table.fields')}</th>
              <th className="px-5 py-3.5">{t('naming.table.folders')}</th>
              <th className="px-5 py-3.5 text-center">{t('naming.table.status')}</th>
              <th className="px-6 py-3.5" />
            </tr>
          </thead>
          <tbody className="text-text">
            {conventions.map((c) => {
              const sortedCodes = [...c.fields]
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((f) => f.code);
              return (
                <tr
                  key={c.id}
                  onClick={() => onOpen(c.id)}
                  className="cursor-pointer border-t border-card-border/60 transition-colors duration-150 hover:bg-primary-ghost"
                >
                  <td className="px-6 py-3 align-top">
                    <p className="cell-wrap font-medium text-primary">{c.name}</p>
                    <p className="cell-wrap mt-0.5 font-mono text-xs text-text-muted">
                      {sortedCodes.join(c.delimiter)}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-center align-top">
                    <span className="rounded-full bg-content-bg px-2.5 py-1 font-mono text-xs font-bold text-text-secondary">
                      {c.delimiter}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center align-top font-semibold">{c.fields.length}</td>
                  <td className="px-5 py-3 align-top">
                    {c.assignedFolders.length === 0 ? (
                      <span className="text-xs text-text-muted">—</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-bold text-primary">
                          {c.assignedFolders.length} {t('naming.foldersUnit')}
                        </span>
                        {c.assignedFolders.slice(0, 2).map((f) => (
                          <span key={f.id} className="rounded-full bg-content-bg px-2 py-0.5 text-xs font-semibold text-text-secondary">
                            {f.name}
                          </span>
                        ))}
                        {c.assignedFolders.length > 2 && (
                          <span className="text-xs font-semibold text-text-muted">
                            +{c.assignedFolders.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center align-top">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.isActive ? 'bg-success-light text-success' : 'bg-content-bg text-text-muted'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${c.isActive ? 'bg-success' : 'bg-text-placeholder'}`} />
                      {c.isActive ? t('naming.status.active') : t('naming.status.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right align-top text-text-muted">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
