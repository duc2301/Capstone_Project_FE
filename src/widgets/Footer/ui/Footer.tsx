import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

interface FooterColumn {
  titleKey: TranslationKey;
  links: TranslationKey[];
}

const COLUMNS: FooterColumn[] = [
  {
    titleKey: 'footer.col.solution',
    links: [
      'footer.col.solution.product',
      'footer.col.solution.solution',
      'footer.col.solution.service',
    ],
  },
  {
    titleKey: 'footer.col.docs',
    links: [
      'footer.col.docs.docs',
      'footer.col.docs.terms',
      'footer.col.docs.privacy',
      'footer.col.docs.standard',
      'footer.col.docs.lawVN',
    ],
  },
  {
    titleKey: 'footer.col.support',
    links: [
      'footer.col.support.contact',
      'footer.col.support.tech',
      'footer.col.support.hq',
      'footer.col.support.social',
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="rounded-t-[32px] bg-[#30312C]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-8 gap-y-12 px-12 py-12 md:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
          <span className="font-display text-2xl font-bold text-[#FF8D28]">
            {t('brand.name')}
          </span>
          <p className="font-jakarta text-xs font-medium leading-4 tracking-[0.6px] text-white">
            {t('footer.copyright')}
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.titleKey} className="flex flex-col gap-3">
            <h4 className="font-jakarta text-sm font-bold tracking-[0.14px] text-white">
              {t(column.titleKey)}
            </h4>
            {column.links.map((link) => (
              <a
                key={link}
                href="#"
                className="font-jakarta text-sm font-semibold tracking-[0.14px] text-white underline underline-offset-2 transition-opacity hover:opacity-80"
              >
                {t(link)}
              </a>
            ))}
          </nav>
        ))}
      </div>
    </footer>
  );
};
