import { Link } from 'react-router-dom';

import { t } from '../shared/lib/i18n/translations';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <span className="text-8xl font-bold text-gray-200">404</span>
      <p className="text-gray-500 text-lg">{t('common.notFound')}</p>
      <Link
        to="/accounts"
        className="text-blue-600 hover:underline"
      >
        {t('common.backHome')}
      </Link>
    </div>
  );
}
