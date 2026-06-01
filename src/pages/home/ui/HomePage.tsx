import { Link } from 'react-router-dom';

import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';
import { Footer } from '@/widgets/Footer';
import { Header } from '@/widgets/Header';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1280&q=80';

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-[32px] border border-white/20 bg-white/20 p-2 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-sm">
        <div
          className="h-[460px] w-full rounded-3xl bg-cover bg-center md:h-[560px]"
          style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
        />
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#FBF9F1]">
      <div
        className="absolute -right-72 -top-48 h-[800px] w-[800px] rounded-full blur-[50px]"
        style={{ backgroundColor: 'rgba(194, 240, 156, 0.2)' }}
      />
      <div
        className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full blur-[40px]"
        style={{ backgroundColor: 'rgba(255, 220, 189, 0.2)' }}
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 pb-24 pt-44 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#C3C9B9]/30 bg-[#EAE8E0] px-4 py-2 font-jakarta text-xs font-medium uppercase tracking-[1.2px] text-[#43493C]">
            <span className="text-[#406623]">✦</span>
            {t('home.hero.badge')}
          </span>

          <h1 className="max-w-[660px] font-display text-[40px] font-bold leading-[1.14] tracking-[-1.12px] text-[#1B1C17] md:text-[56px] md:leading-[64px]">
            {t('home.hero.titleLead')}{' '}
            <span className="italic text-[#406623]">{t('home.hero.titleAccent')}</span>
          </h1>

          <p className="max-w-xl font-jakarta text-lg leading-7 text-[#43493C]">
            {t('home.hero.subtitle')}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[#406623] px-8 py-4 font-jakarta text-sm font-semibold tracking-[0.14px] text-white transition-colors hover:bg-[#34521c]"
            >
              {t('home.hero.ctaPrimary')}
              <ArrowRightIcon />
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[#406623] px-8 py-4 font-jakarta text-sm font-semibold tracking-[0.14px] text-[#406623] transition-colors hover:bg-[#406623]/5"
            >
              <PlayIcon />
              {t('home.hero.ctaSecondary')}
            </button>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

const WITHOUT_CDE_ITEMS: TranslationKey[] = [
  'home.why.without.item1',
  'home.why.without.item2',
  'home.why.without.item3',
];

const WITH_CDE_ITEMS: TranslationKey[] = [
  'home.why.with.item1',
  'home.why.with.item2',
  'home.why.with.item3',
];

function WarningIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#93000A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function CheckShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CrossMarkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BA1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function CheckMarkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function WhyCdeSection() {
  return (
    <section className="bg-[#F6F4EC] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 font-display text-[32px] font-semibold text-[#1B1C17]">
            {t('home.why.title')}
          </h2>
          <p className="font-jakarta text-base text-[#43493C]">{t('home.why.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <article className="relative overflow-hidden rounded-3xl border border-[#FFDAD6] bg-[#FBF9F1] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-[#FFDAD6]/20" />
            <div className="relative flex flex-col gap-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFDAD6]">
                <WarningIcon />
              </span>
              <h3 className="font-display text-2xl font-semibold text-[#1B1C17]">
                {t('home.why.without.title')}
              </h3>
              <ul className="flex flex-col gap-4">
                {WITHOUT_CDE_ITEMS.map((key) => (
                  <li key={key} className="flex items-start gap-3 font-jakarta text-base leading-6 text-[#43493C]">
                    <CrossMarkIcon />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-3xl border border-[#406623]/20 bg-[#406623]/[0.05] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-[#406623]/10" />
            <div className="relative flex flex-col gap-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#406623]">
                <CheckShieldIcon />
              </span>
              <h3 className="font-display text-2xl font-semibold text-[#1B1C17]">
                {t('home.why.with.title')}
              </h3>
              <ul className="flex flex-col gap-4">
                {WITH_CDE_ITEMS.map((key) => (
                  <li key={key} className="flex items-start gap-3 font-jakarta text-base leading-6 text-[#43493C]">
                    <CheckMarkIcon />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

interface TeamMember {
  nameKey: TranslationKey;
  rolesKey: TranslationKey;
  isLeader?: boolean;
}

const TEAM_MEMBERS: TeamMember[] = [
  { nameKey: 'home.team.member1.name', rolesKey: 'home.team.member1.roles' },
  { nameKey: 'home.team.member2.name', rolesKey: 'home.team.member2.roles' },
  { nameKey: 'home.team.member3.name', rolesKey: 'home.team.member3.roles', isLeader: true },
  { nameKey: 'home.team.member4.name', rolesKey: 'home.team.member4.roles' },
  { nameKey: 'home.team.member5.name', rolesKey: 'home.team.member5.roles' },
];

function MemberAvatar() {
  return (
    <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#E4E3DB]">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </span>
  );
}

function TeamSection() {
  return (
    <section className="bg-[#FBF9F1] pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="mb-4 font-display text-[32px] font-semibold text-[#1B1C17]">
            {t('home.team.title')}
          </h2>
          <p className="font-jakarta text-lg leading-7 text-[#43493C]">
            {t('home.team.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {TEAM_MEMBERS.map((member) => (
            <article
              key={member.nameKey}
              className="flex w-full flex-col items-center gap-3 rounded-3xl border border-[#E8E6E0] bg-white px-6 pb-10 pt-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
            >
              <MemberAvatar />
              <div className="flex flex-wrap items-center justify-center gap-2">
                <h3 className="font-display text-xl font-semibold text-[#1B1C17]">
                  {t(member.nameKey)}
                </h3>
                {member.isLeader && (
                  <span className="rounded-full bg-[#406623]/10 px-2 py-0.5 font-jakarta text-[11px] font-semibold uppercase tracking-[0.6px] text-[#406623]">
                    {t('home.team.leaderBadge')}
                  </span>
                )}
              </div>
              <p className="font-jakarta text-sm leading-5 text-[#43493C]">
                {t(member.rolesKey)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBF9F1]">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <WhyCdeSection />
        <TeamSection />
      </main>
      <Footer />
    </div>
  );
}
