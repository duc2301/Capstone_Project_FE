import { Footer } from '../widgets/Footer';
import { Header } from '../widgets/Header';
import { t } from '../shared/lib/i18n/translations';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-[#FBF9F1]">
      {/* top-right quarter circle #C2F09C 20% */}
      <div
        className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full"
        style={{ backgroundColor: 'rgba(194, 240, 156, 0.2)' }}
      />
      {/* bottom-left larger circle #FFDCBD 20% */}
      <div
        className="absolute -bottom-60 -left-60 w-[720px] h-[720px] rounded-full"
        style={{ backgroundColor: 'rgba(255, 220, 189, 0.2)' }}
      />

      <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div className="space-y-7">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-[#406623]/20 text-[#406623] text-[11px] font-semibold tracking-wide uppercase">
            <span className="text-[#406623]">✦</span>
            {t('home.hero.badge')}
          </span>

          <h1
            className="text-[44px] md:text-[56px] font-bold text-slate-900 leading-[1.1] tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {t('home.hero.titleLead')}{' '}
            <span className="italic font-semibold">
              {t('home.hero.titleAccent')}
            </span>
          </h1>

          <p className="text-slate-600 text-[15px] leading-relaxed max-w-xl">
            {t('home.hero.subtitle')}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              className="px-6 py-3 rounded-full bg-[#406623] text-white text-[13px] font-medium hover:bg-[#34521c] transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              {t('home.hero.ctaPrimary')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              className="px-6 py-3 rounded-full bg-white border border-slate-300 text-slate-800 text-[13px] font-medium hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              {t('home.hero.ctaSecondary')}
            </button>
          </div>
        </div>

        {/* Right: image with floating tags + card */}
        <div className="relative h-[460px]">
          {/* image */}
          <div
            className="absolute inset-0 rounded-2xl bg-cover bg-center shadow-2xl shadow-emerald-900/20"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80")',
            }}
          />

          {/* WIP tag */}
          <div className="absolute top-5 right-5 px-3 py-1.5 rounded-full bg-[#406623]/90 backdrop-blur-sm text-white text-[11px] font-medium inline-flex items-center gap-2 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300" />
            {t('home.hero.tag.wip')}
          </div>

          {/* Shared tag */}
          <div className="absolute top-1/2 right-8 -translate-y-8 px-3 py-1.5 rounded-full bg-[#406623]/90 backdrop-blur-sm text-white text-[11px] font-medium inline-flex items-center gap-2 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-300" />
            {t('home.hero.tag.shared')}
          </div>

          {/* Published card */}
          <div className="absolute -bottom-6 left-6 right-6 bg-white rounded-2xl shadow-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#406623]" />
              <span className="text-[11px] font-medium text-slate-500">
                {t('home.hero.card.published')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#406623]/10 flex items-center justify-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="2">
                    <path d="M4 21V7l8-4 8 4v14" />
                    <path d="M9 21v-6h6v6" />
                    <path d="M9 11h.01M15 11h.01" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-slate-900 truncate">
                    {t('home.hero.card.title')}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {t('home.hero.card.subtitle')}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#406623]/10 text-[#406623] text-[11px] font-medium whitespace-nowrap">
                {t('home.hero.card.status')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const WhySection = () => {
  const withoutItems = [
    'home.why.without.item1',
    'home.why.without.item2',
    'home.why.without.item3',
  ] as const;
  const withItems = [
    'home.why.with.item1',
    'home.why.with.item2',
    'home.why.with.item3',
  ] as const;

  return (
    <section className="relative bg-[#F6F4EC] py-24 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-[32px] md:text-[36px] font-bold text-slate-900 mb-3">
            {t('home.why.title')}
          </h2>
          <p className="text-slate-500 text-[14px] max-w-2xl mx-auto leading-relaxed">
            {t('home.why.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Without */}
          <div className="relative rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-red-50/60 -mr-8 -mt-8" />
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </div>
              <h3 className="text-[18px] font-semibold text-slate-900 mb-4">
                {t('home.why.without.title')}
              </h3>
              <ul className="space-y-3">
                {withoutItems.map((k) => (
                  <li key={k} className="flex items-start gap-2.5 text-[13px] text-slate-600 leading-relaxed">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" className="mt-0.5 shrink-0">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                    <span>{t(k)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* With */}
          <div className="relative rounded-2xl border bg-white p-7 shadow-sm overflow-hidden" style={{ borderColor: 'rgba(64, 102, 35, 0.25)' }}>
            <div
              className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8"
              style={{ backgroundColor: 'rgba(64, 102, 35, 0.06)' }}
            />
            <div className="relative">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(64, 102, 35, 0.1)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="2.5">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h3 className="text-[18px] font-semibold text-slate-900 mb-4">
                {t('home.why.with.title')}
              </h3>
              <ul className="space-y-3">
                {withItems.map((k) => (
                  <li key={k} className="flex items-start gap-2.5 text-[13px] text-slate-700 leading-relaxed">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="2.5" className="mt-0.5 shrink-0">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span>{t(k)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <WhySection />
      </main>
      <Footer />
    </div>
  );
};
