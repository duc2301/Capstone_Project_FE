import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

interface PlaceholderPageProps {
  titleKey: TranslationKey;
  descKey: TranslationKey;
}

export function PlaceholderPage({ titleKey, descKey }: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-bold text-text">{t(titleKey)}</h1>
      <p className="mt-3 text-text-muted">{t(descKey)}</p>
      <p className="mt-6 rounded-full bg-warning-light px-4 py-2 text-sm font-medium text-warning">
        {t('placeholder.comingSoon')}
      </p>
    </div>
  );
}
