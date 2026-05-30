import { t } from '@/shared/lib/i18n';

const columns = [
  {
    titleKey: 'footer.col.product',
    items: [
      'footer.col.product.solution',
      'footer.col.product.features',
      'footer.col.product.pricing',
      'footer.col.product.docs',
    ],
  },
  {
    titleKey: 'footer.col.docs',
    items: [
      'footer.col.docs.guide',
      'footer.col.docs.api',
      'footer.col.docs.standard',
      'footer.col.docs.lawVN',
    ],
  },
  {
    titleKey: 'footer.col.support',
    items: [
      'footer.col.support.contact',
      'footer.col.support.tech',
      'footer.col.support.training',
      'footer.col.support.community',
    ],
  },
] as const;

export const Footer = () => {
  return (
    <footer className="bg-[#30312C] text-slate-300 mt-0">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-[#406623] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M4 21V8l8-5 8 5v13" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </div>
            <span className="font-semibold text-white">{t('brand.name')}</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{t('footer.tagline')}</p>
        </div>

        {columns.map((col) => (
          <div key={col.titleKey}>
            <h4 className="text-white text-sm font-semibold mb-3">{t(col.titleKey)}</h4>
            <ul className="space-y-2">
              {col.items.map((item) => (
                <li key={item}>
                  <a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">
                    {t(item)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
};
