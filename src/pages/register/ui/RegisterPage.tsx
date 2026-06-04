import type { ReactNode } from 'react';

import { RegisterForm } from '@/features/auth';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';
import { AuthLayout } from '@/widgets/AuthLayout';

interface VisualCard {
  icon: ReactNode;
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

function CubeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.27 6.96 8.73 5.05 8.73-5.05M12 22.08V12" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="19" r="3" />
      <circle cx="19" cy="19" r="3" />
      <path d="M10.5 7.5 6.5 16.5M13.5 7.5l4 9M8 19h8" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

const VISUAL_CARDS: VisualCard[] = [
  { icon: <CubeIcon />, titleKey: 'register.visual.card1.title', descKey: 'register.visual.card1.desc' },
  { icon: <NetworkIcon />, titleKey: 'register.visual.card2.title', descKey: 'register.visual.card2.desc' },
  { icon: <ShieldCheckIcon />, titleKey: 'register.visual.card3.title', descKey: 'register.visual.card3.desc' },
];

/** Dải thẻ trang trí BIM (chỉ trực quan) nằm dưới thẻ đăng ký. */
function DecorativeBimVisuals() {
  return (
    <div className="mt-20 grid w-full max-w-[1408px] grid-cols-1 gap-4 md:grid-cols-3">
      {VISUAL_CARDS.map((card) => (
        <article
          key={card.titleKey}
          className="flex flex-col gap-4 rounded-3xl border border-white/50 bg-white/40 p-8 backdrop-blur-sm"
        >
          <span>{card.icon}</span>
          <h3 className="font-display text-2xl font-semibold text-[#1B1C17]">
            {t(card.titleKey)}
          </h3>
          <p className="font-jakarta text-base leading-6 text-[#43493C]">
            {t(card.descKey)}
          </p>
        </article>
      ))}
    </div>
  );
}

export function RegisterPage() {
  return (
    <AuthLayout>
      <div className="flex h-full items-center justify-center overflow-y-auto px-4 py-6">
        <RegisterForm />
      </div>
    </AuthLayout>
  );
}
