import { LoginForm } from '@/features/auth';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';
import { AuthLayout } from '@/widgets/AuthLayout';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1280&q=80';

const BRAND_FEATURES: { titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { titleKey: 'login.brand.feature1.title', descKey: 'login.brand.feature1.desc' },
  { titleKey: 'login.brand.feature2.title', descKey: 'login.brand.feature2.desc' },
];

function FeatureIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 24 24" fill="none" stroke="#FDA133" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LoginBrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-end overflow-hidden bg-[#406623] p-12 lg:flex">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(180deg, rgba(64, 102, 35, 0.4) 0%, rgba(27, 28, 23, 0.8) 100%)',
        }}
      />

      <div className="relative z-[2] flex max-w-[512px] flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-[56px] font-bold leading-[1.14] tracking-[-1.12px] text-white">
            {t('login.brand.heading')}
          </h2>
          <p className="font-jakarta text-lg leading-7 text-[#E4E3DB]/90">
            {t('login.brand.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-12 gap-y-6 border-t border-white/10 pt-8">
          {BRAND_FEATURES.map((feature) => (
            <div key={feature.titleKey} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0">
                <FeatureIcon />
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-jakarta text-sm font-semibold tracking-[0.14px] text-white">
                  {t(feature.titleKey)}
                </span>
                <span className="font-jakarta text-xs font-medium tracking-[0.6px] text-[#C3C9B9]">
                  {t(feature.descKey)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function LoginPage() {
  return (
    <AuthLayout>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <LoginBrandPanel />
        <div className="flex items-center justify-center px-6 pb-8 pt-24 lg:px-12">
          <LoginForm />
        </div>
      </div>
    </AuthLayout>
  );
}
