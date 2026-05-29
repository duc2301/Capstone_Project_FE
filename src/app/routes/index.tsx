import { Route, Routes } from 'react-router-dom';

import { AccountsPage } from '../../pages/AccountsPage';
import { HomePage } from '../../pages/HomePage';
import { NotFoundPage } from '../../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/accounts" element={<AccountsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
