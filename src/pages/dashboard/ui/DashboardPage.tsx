
import { useDashboard } from '@/features/dashboard/model/useDashboard';
import { t } from '@/shared/lib/i18n';
import type { TranslationKey } from '@/shared/lib/i18n';

export function DashboardPage() {
  const { currentUser, unreadCount, loading, stats, greetingKey, todayStr } = useDashboard();

  if (loading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const firstName = currentUser?.userName?.split(' ').pop() || 'User';

  return (
    <div className="mx-auto max-w-[1400px] p-6 lg:p-8">
      {/* ── Greeting Banner ─────────────────────────── */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold text-text">
            {t(greetingKey as TranslationKey)}, {firstName} <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className="mt-2 text-text-muted">
            {t('dashboard.subtitle')} · {todayStr}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-warning-light px-4 py-2 text-sm font-medium text-warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {todayStr.split(', ')[1]}
        </div>
      </div>

      {/* ── Stats Cards ─────────────────────────────── */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Projects */}
        <div className="flex flex-col rounded-2xl border border-card-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="rounded-full bg-success-light px-2.5 py-0.5 text-xs font-bold text-success">
              +2 {t('dashboard.stats.projectsNew')}
            </span>
          </div>
          <div className="text-3xl font-bold text-text">{stats.projects}</div>
          <div className="mt-1 text-sm text-text-muted">{t('dashboard.stats.projects')}</div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div className="flex flex-col rounded-2xl border border-warning/20 bg-warning-light/30 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-light text-warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="rounded-full bg-danger px-2.5 py-0.5 text-xs font-bold text-white">
              {t('dashboard.stats.pendingUrgent')}
            </span>
          </div>
          <div className="text-3xl font-bold text-warning">{stats.pendingApprovals}</div>
          <div className="mt-1 text-sm text-warning/80">{t('dashboard.stats.pending')}</div>
        </div>

        {/* Card 3: Notifications */}
        <div className="flex flex-col rounded-2xl border border-danger/10 bg-danger-light/30 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-light text-danger">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-danger">{unreadCount}</div>
          <div className="mt-1 text-sm text-danger/80">{t('dashboard.stats.unread')}</div>
        </div>

        {/* Card 4: Completed Tasks */}
        <div className="flex flex-col rounded-2xl border border-success/20 bg-success-light/30 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-light text-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-success">{stats.completedTasks}</div>
          <div className="mt-1 text-sm text-success/80">{t('dashboard.stats.completed')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ── Left Column (Urgent Tasks & Projects) ── */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          
          {/* Urgent Tasks */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-text">
                <span className="text-xl">🔥</span> {t('dashboard.urgent.title')}
              </h2>
              <button className="text-sm font-medium text-text-muted hover:text-primary">
                {t('dashboard.urgent.viewAll')} ({stats.urgentTasks.length})
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {stats.urgentTasks.map((task) => (
                <div key={task.id} className="flex flex-col gap-4 rounded-xl border border-card-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4 sm:items-center">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${task.isWarning ? 'bg-warning-light text-warning' : 'bg-danger-light text-danger'}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {task.isWarning ? (
                          <>
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </>
                        ) : (
                          <>
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                            <path d="M12 11v6" />
                            <path d="M9 14l3 3 3-3" />
                          </>
                        )}
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text">{task.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs font-medium text-text-muted">
                        <span className="rounded bg-content-bg px-2 py-0.5 text-text-secondary">{task.projectCode}</span>
                        <span className="flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {task.timeLeft}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="flex items-center justify-center gap-1 rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-content-bg">
                    Xử lý
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Project Progress */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">{t('dashboard.progress.title')}</h2>
              <button className="text-sm font-medium text-text-muted hover:text-primary">
                Tất cả dự án
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.projectProgress.map((project) => (
                <div key={project.id} className="flex flex-col justify-between rounded-xl border border-card-border bg-card p-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded bg-content-bg px-2 py-1 text-xs font-bold text-text-muted">{project.code}</span>
                      <button className="text-text-muted hover:text-text">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                      </button>
                    </div>
                    <h3 className="mb-4 font-semibold text-text">{project.name}</h3>
                    
                    <div className="mb-1 flex items-center justify-between text-xs font-bold text-text">
                      <span>Tiến độ tổng</span>
                      <span className="text-primary">{project.progress}%</span>
                    </div>
                    <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-content-bg">
                      <div className="h-full bg-primary" style={{ width: `${project.progress}%` }} />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center justify-center rounded-lg bg-content-bg p-2 text-center">
                        <span className="mb-1 text-[10px] font-bold text-text-muted">WIP</span>
                        <span className="font-bold text-text">{project.wip}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-lg bg-content-bg p-2 text-center">
                        <span className="mb-1 text-[10px] font-bold text-text-muted">SHARED</span>
                        <span className="font-bold text-text">{project.shared}</span>
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-lg bg-warning-light p-2 text-center">
                        <span className="mb-1 text-[10px] font-bold text-warning">PUB</span>
                        <span className="font-bold text-warning">{project.pub}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-5 flex items-center justify-between pt-4 border-t border-card-border">
                    <div className="flex -space-x-2">
                      {project.members.map((m: string, i: number) => (
                        <div key={i} className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold ${i === 2 ? 'bg-primary-light text-primary' : 'bg-primary text-white'}`}>
                          {m}
                        </div>
                      ))}
                    </div>
                    <a href={`/projects/${project.id}/documents`} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                      {t('dashboard.progress.openProject')}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* ── Right Column (Activity & Calendar) ───── */}
        <div className="flex flex-col gap-8">
          
          {/* Activity Feed */}
          <section className="flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card">
            <div className="border-b border-card-border p-4">
              <div className="flex items-center gap-4">
                <button className="border-b-2 border-primary pb-2 text-sm font-bold text-primary">
                  {t('dashboard.activity.myTab')}
                </button>
                <button className="border-b-2 border-transparent pb-2 text-sm font-bold text-text-muted transition-colors hover:text-text">
                  {t('dashboard.activity.projectTab')}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="relative border-l border-card-border ml-3 space-y-6">
                {stats.activities.map((act) => (
                  <div key={act.id} className="relative pl-6">
                    <div className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full border border-card-border bg-content-bg text-text-muted">
                      {act.type === 'approve' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                      )}
                      {act.type === 'upload' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      )}
                      {act.type === 'comment' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      )}
                      {act.type === 'sign' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-text" dangerouslySetInnerHTML={{ __html: act.content.replace(/(MEP_[^\s]+|Hồ sơ thiết kế[\w\s]+|Issue #[0-9]+|Biên bản nghiệm thu)/, '<span class="font-bold text-primary">$&</span>') }} />
                      <span className="mt-1 text-xs text-text-muted">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Calendar placeholder to match mockup */}
          <section className="rounded-2xl border border-card-border bg-card p-5">
            <h2 className="mb-4 text-lg font-bold text-text">{t('dashboard.calendar.title')}</h2>
            
            {/* Week View Mock */}
            <div className="mb-6 flex justify-between text-center">
              {['S','M','T','W','T','F','S'].map((day, i) => (
                <div key={i} className={`flex flex-col items-center gap-1 ${i === 5 ? 'text-primary' : 'text-text-muted'}`}>
                  <span className="text-[10px] font-bold">{day}</span>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i === 5 ? 'bg-primary text-white' : i === 3 ? 'text-text relative after:absolute after:bottom-1 after:h-1 after:w-1 after:rounded-full after:bg-danger' : 'text-text'}`}>
                    {17 + i}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 rounded-xl bg-content-bg p-3">
                <div className="flex flex-col items-center justify-center rounded bg-white px-3 py-1 text-danger shadow-sm">
                  <span className="text-sm font-bold">14:00</span>
                  <span className="text-[10px] font-bold">SÁNG</span>
                </div>
                <div>
                  <h4 className="font-bold text-text">Họp review thiết kế</h4>
                  <span className="text-xs text-text-muted">Phòng họp ảo BIM 01</span>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl bg-primary-light p-3">
                <div className="flex flex-col items-center justify-center rounded bg-white px-3 py-1 text-primary shadow-sm">
                  <span className="text-sm font-bold">16:30</span>
                  <span className="text-[10px] font-bold">CHIỀU</span>
                </div>
                <div>
                  <h4 className="font-bold text-primary">Phê duyệt MEP Tầng 5</h4>
                  <span className="text-xs text-primary/70">Hạn cuối nộp báo cáo</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
