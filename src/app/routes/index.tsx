import { Navigate, Route, Routes } from 'react-router-dom';

import { AccountsPage } from '../../pages/AccountsPage';
import { NotFoundPage } from '../../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/accounts" replace />} />
      <Route path="/accounts" element={<AccountsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
