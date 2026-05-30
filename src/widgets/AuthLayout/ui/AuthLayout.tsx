import type { ReactNode } from 'react';

import { t } from '@/shared/lib/i18n';

const HERO_TAGS = ['login.hero.tag1', 'login.hero.tag2', 'login.hero.tag3'] as const;

function BrandHeroPanel() {
  return (
    <aside className="relative flex flex-col justify-between items-start p-8 w-[40%] min-h-screen bg-[#1D2027] border-r border-[#414754] overflow-hidden isolate">
      <div
        className="absolute inset-0 z-0 opacity-30"
        style={{
          mixBlendMode: 'luminosity',
          backgroundImage: `
            radial-gradient(ellipse at 20% 50%, rgba(172, 199, 255, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(73, 219, 205, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(172, 199, 255, 0.04) 0%, transparent 40%),
            repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(65, 71, 84, 0.15) 40px, rgba(65, 71, 84, 0.15) 41px),
            repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(65, 71, 84, 0.15) 40px, rgba(65, 71, 84, 0.15) 41px)
          `,
        }}
      />

      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(0deg, #1D2027 0%, rgba(29, 32, 39, 0.8) 50%, rgba(29, 32, 39, 0.1) 100%)',
        }}
      />

      <div className="relative z-[2] flex items-center gap-2">
        <svg width="27" height="27" viewBox="0 0 27 27" fill="none">
          <path
            d="M13.335 0L0 6.065V15.15c0 8.418 5.69 16.25 13.335 18.185C20.98 31.4 26.67 23.568 26.67 15.15V6.065L13.335 0z"
            fill="#ACC7FF"
          />
          <path
            d="M6 13l4.5 4.5L18 10"
            stroke="#1D2027"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-heading text-2xl font-semibold leading-[31px] tracking-[-0.6px] uppercase text-[#ACC7FF]">
          {t('login.hero.brand')}
        </span>
      </div>

      <div className="relative z-[3] flex flex-col items-start gap-6 w-full">
        <h2 className="font-heading text-[48px] font-bold leading-[53px] tracking-[-0.96px] text-[#E0E2EC]">
          {t('login.hero.heading')}
        </h2>

        <div className="flex flex-wrap gap-2">
          {HERO_TAGS.map((tagKey) => (
            <div
              key={tagKey}
              className="box-border flex items-center gap-1 px-2 py-1 bg-[#272A31] border border-[#414754] rounded-sm"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C1C6D6" strokeWidth="2.5">
                {tagKey === 'login.hero.tag1' && (
                  <>
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                  </>
                )}
                {tagKey === 'login.hero.tag2' && (
                  <>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </>
                )}
                {tagKey === 'login.hero.tag3' && (
                  <>
                    <path d="M4 21V7l8-4 8 4v14" />
                    <path d="M9 21v-6h6v6" />
                  </>
                )}
              </svg>
              <span className="font-heading text-xs font-bold leading-3 tracking-[0.6px] text-[#C1C6D6]">
                {t(tagKey)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

interface Props {
  children: ReactNode;
}

export function AuthLayout({ children }: Props) {
  return (
    <div className="flex flex-row items-start min-h-screen w-full bg-[#10131A]">
      <BrandHeroPanel />
      <section className="relative flex flex-col justify-center items-center px-6 lg:px-[120px] w-[60%] min-h-screen bg-[#10131A] isolate">
        {children}
      </section>
    </div>
  );
}
