import type { ReactNode } from 'react';

import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';
import { Footer } from '@/widgets/Footer';
import { Header } from '@/widgets/Header';

const PAGE_BACKGROUND =
  'radial-gradient(113.14% 141.42% at 80% 0%, rgba(168, 204, 117, 0.15) 0%, rgba(168, 204, 117, 0) 50%), radial-gradient(141.42% 70.71% at 0% 50%, rgba(168, 204, 117, 0.1) 0%, rgba(168, 204, 117, 0) 50%), #FBF9F1';

const CLOUD_IMAGE =
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1280&q=80';

function HeroSection() {
  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <h1 className="max-w-[896px] font-display text-[40px] font-bold leading-[1.14] tracking-[-1.12px] text-[#1B1C17] md:text-[56px] md:leading-[64px]">
        {t('about.hero.titleLead')}
        <span className="block text-[#406623]">{t('about.hero.titleAccent')}</span>
      </h1>
      <p className="max-w-[672px] font-jakarta text-lg leading-7 text-[#43493C]">
        {t('about.hero.subtitle')}
      </p>
    </section>
  );
}

interface CloudCard {
  icon: ReactNode;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function GaugeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14 9 11" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
      <circle cx="12" cy="14" r="1.5" />
    </svg>
  );
}

function BackupIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v4h-4" />
    </svg>
  );
}

const CLOUD_CARDS: CloudCard[] = [
  { icon: <ShieldIcon />, titleKey: 'about.cloud.card1.title', descKey: 'about.cloud.card1.desc' },
  { icon: <GaugeIcon />, titleKey: 'about.cloud.card2.title', descKey: 'about.cloud.card2.desc' },
  { icon: <BackupIcon />, titleKey: 'about.cloud.card3.title', descKey: 'about.cloud.card3.desc' },
];

function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#587F39]">
      {children}
    </span>
  );
}

function CloudSection() {
  return (
    <section className="flex flex-col gap-12">
      <div className="flex items-center gap-4">
        <SectionIcon>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F9FFEC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.8A3.5 3.5 0 0 0 6.5 19z" />
          </svg>
        </SectionIcon>
        <div className="flex flex-col">
          <h2 className="font-display text-[32px] font-semibold leading-10 text-[#1B1C17]">
            {t('about.cloud.title')}
          </h2>
          <p className="font-jakarta text-base text-[#43493C]">{t('about.cloud.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[5fr_7fr] lg:items-stretch">
        <div className="flex flex-col gap-6">
          {CLOUD_CARDS.map((card) => (
            <article
              key={card.titleKey}
              className="flex items-start gap-4 rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-sm"
            >
              <span className="mt-1 shrink-0">{card.icon}</span>
              <div className="flex flex-col gap-2">
                <h3 className="font-jakarta text-sm font-semibold tracking-[0.14px] text-[#1B1C17]">
                  {t(card.titleKey)}
                </h3>
                <p className="font-jakarta text-base leading-6 text-[#43493C]">{t(card.descKey)}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="relative min-h-[400px] overflow-hidden rounded-3xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${CLOUD_IMAGE}")` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(45deg, rgba(251, 249, 241, 0.8) 0%, rgba(251, 249, 241, 0) 100%)',
            }}
          />
        </div>
      </div>
    </section>
  );
}

interface DataZone {
  icon: ReactNode;
  iconBg: string;
  cornerBg: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  accessKey: TranslationKey;
}

const DATA_ZONES: DataZone[] = [
  {
    iconBg: 'rgba(253, 161, 51, 0.2)',
    cornerBg: 'rgba(253, 161, 51, 0.1)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A5100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
      </svg>
    ),
    titleKey: 'about.zones.wip.title',
    descKey: 'about.zones.wip.desc',
    accessKey: 'about.zones.wip.access',
  },
  {
    iconBg: 'rgba(88, 127, 57, 0.2)',
    cornerBg: 'rgba(88, 127, 57, 0.1)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
      </svg>
    ),
    titleKey: 'about.zones.shared.title',
    descKey: 'about.zones.shared.desc',
    accessKey: 'about.zones.shared.access',
  },
  {
    iconBg: 'rgba(102, 123, 85, 0.2)',
    cornerBg: 'rgba(102, 123, 85, 0.1)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4E623E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20 15.3 15.3 0 0 1 0-20z" />
      </svg>
    ),
    titleKey: 'about.zones.published.title',
    descKey: 'about.zones.published.desc',
    accessKey: 'about.zones.published.access',
  },
  {
    iconBg: '#E4E3DB',
    cornerBg: 'rgba(228, 227, 219, 0.3)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#43493C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="4" rx="1" />
        <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
      </svg>
    ),
    titleKey: 'about.zones.archived.title',
    descKey: 'about.zones.archived.desc',
    accessKey: 'about.zones.archived.access',
  },
];

function ZonesSection() {
  return (
    <section className="flex flex-col gap-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="rounded-full bg-[#E4E3DB] px-4 py-1.5 font-jakarta text-xs font-medium tracking-[0.6px] text-[#43493C]">
          {t('about.zones.badge')}
        </span>
        <h2 className="font-display text-[32px] font-semibold leading-10 text-[#1B1C17]">
          {t('about.zones.title')}
        </h2>
        <p className="max-w-[672px] font-jakarta text-base text-[#43493C]">
          {t('about.zones.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {DATA_ZONES.map((zone) => (
          <article
            key={zone.titleKey}
            className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-[#C3C9B9]/30 bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
          >
            <div
              className="absolute -right-16 -top-16 h-32 w-32 rounded-bl-full"
              style={{ backgroundColor: zone.cornerBg }}
            />
            <span
              className="relative flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: zone.iconBg }}
            >
              {zone.icon}
            </span>
            <h3 className="relative font-display text-2xl font-semibold leading-8 text-[#1B1C17]">
              {t(zone.titleKey)}
            </h3>
            <p className="relative flex-1 font-jakarta text-base leading-6 text-[#43493C]">
              {t(zone.descKey)}
            </p>
            <span className="relative w-fit rounded-full bg-[#E4E3DB] px-3 py-1 font-jakarta text-xs font-medium tracking-[0.6px] text-[#43493C]">
              {t(zone.accessKey)}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

type ZoneId = 'wip' | 'shared' | 'published' | 'archived';

const ZONE_TAG: Record<ZoneId, { labelKey: TranslationKey; bg: string; color: string }> = {
  wip: { labelKey: 'about.roles.zone.wip', bg: 'rgba(253, 161, 51, 0.2)', color: '#8A5100' },
  shared: { labelKey: 'about.roles.zone.shared', bg: 'rgba(88, 127, 57, 0.2)', color: '#406623' },
  published: { labelKey: 'about.roles.zone.published', bg: 'rgba(102, 123, 85, 0.2)', color: '#4E623E' },
  archived: { labelKey: 'about.roles.zone.archived', bg: '#E4E3DB', color: '#43493C' },
};

interface RoleRow {
  icon: ReactNode;
  iconBg: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  zones: ZoneId[];
  permissionKey: TranslationKey;
  permissionStrong: boolean;
}

const ROLE_ROWS: RoleRow[] = [
  {
    iconBg: 'rgba(64, 102, 35, 0.1)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
        <path d="M9 9v.01M9 12v.01M9 15v.01" />
      </svg>
    ),
    nameKey: 'about.roles.row1.name',
    descKey: 'about.roles.row1.desc',
    zones: ['shared', 'published', 'archived'],
    permissionKey: 'about.roles.row1.permission',
    permissionStrong: true,
  },
  {
    iconBg: 'rgba(138, 81, 0, 0.1)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A5100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 19 7-7 3 3-7 7-3-3z" />
        <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18z" />
        <path d="m2 2 7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    nameKey: 'about.roles.row2.name',
    descKey: 'about.roles.row2.desc',
    zones: ['wip', 'shared'],
    permissionKey: 'about.roles.row2.permission',
    permissionStrong: false,
  },
  {
    iconBg: 'rgba(78, 98, 62, 0.1)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4E623E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    ),
    nameKey: 'about.roles.row3.name',
    descKey: 'about.roles.row3.desc',
    zones: ['shared', 'published'],
    permissionKey: 'about.roles.row3.permission',
    permissionStrong: true,
  },
  {
    iconBg: 'rgba(115, 121, 107, 0.1)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#73796B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 18a10 10 0 0 1 20 0" />
        <path d="M12 2a6 6 0 0 0-6 6v4h12V8a6 6 0 0 0-6-6z" />
        <path d="M2 18h20v2H2z" />
      </svg>
    ),
    nameKey: 'about.roles.row4.name',
    descKey: 'about.roles.row4.desc',
    zones: ['published', 'archived'],
    permissionKey: 'about.roles.row4.permission',
    permissionStrong: false,
  },
];

function ZoneTags({ zones }: { zones: ZoneId[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {zones.map((zone) => {
        const tag = ZONE_TAG[zone];
        if (!tag) return null;
        return (
          <span
            key={zone}
            className="rounded px-2 py-1 font-jakarta text-[10px] leading-none"
            style={{ backgroundColor: tag.bg, color: tag.color }}
          >
            {t(tag.labelKey)}
          </span>
        );
      })}
    </div>
  );
}

function RolesSection() {
  return (
    <section className="flex flex-col gap-10">
      <div className="flex max-w-[672px] flex-col gap-4">
        <h2 className="font-display text-[32px] font-semibold leading-10 text-[#1B1C17]">
          {t('about.roles.title')}
        </h2>
        <p className="font-jakarta text-base text-[#43493C]">{t('about.roles.subtitle')}</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#C3C9B9]/30 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <div className="hidden grid-cols-[1.2fr_2fr_1.6fr_0.9fr] gap-4 border-b border-[#C3C9B9]/30 bg-[#F6F4EC] px-8 py-4 md:grid">
          <span className="font-jakarta text-sm font-semibold tracking-[0.14px] text-[#43493C]">
            {t('about.roles.col.role')}
          </span>
          <span className="font-jakarta text-sm font-semibold tracking-[0.14px] text-[#43493C]">
            {t('about.roles.col.responsibility')}
          </span>
          <span className="font-jakarta text-sm font-semibold tracking-[0.14px] text-[#43493C]">
            {t('about.roles.col.zones')}
          </span>
          <span className="text-right font-jakarta text-sm font-semibold tracking-[0.14px] text-[#43493C]">
            {t('about.roles.col.permission')}
          </span>
        </div>

        {ROLE_ROWS.map((role) => (
          <div
            key={role.nameKey}
            className="grid grid-cols-1 gap-4 border-b border-[#C3C9B9]/10 px-6 py-6 last:border-b-0 md:grid-cols-[1.2fr_2fr_1.6fr_0.9fr] md:items-center md:px-8"
          >
            <div className="flex items-center gap-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: role.iconBg }}
              >
                {role.icon}
              </span>
              <span className="font-jakarta text-sm font-semibold tracking-[0.14px] text-[#1B1C17]">
                {t(role.nameKey)}
              </span>
            </div>
            <p className="font-jakarta text-base leading-6 text-[#43493C]">{t(role.descKey)}</p>
            <ZoneTags zones={role.zones} />
            <div className="md:flex md:justify-end">
              <span
                className="w-fit rounded-full px-3 py-1 font-jakarta text-xs font-medium tracking-[0.6px]"
                style={
                  role.permissionStrong
                    ? { backgroundColor: '#406623', color: '#FFFFFF' }
                    : { backgroundColor: '#E4E3DB', color: '#43493C' }
                }
              >
                {t(role.permissionKey)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: PAGE_BACKGROUND }}>
      <Header />
      <main className="flex-1">
        <div className="mx-auto flex max-w-7xl flex-col gap-32 px-6 pb-48 pt-28">
          <HeroSection />
          <CloudSection />
          <ZonesSection />
          <RolesSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
