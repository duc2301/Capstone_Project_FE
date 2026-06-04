import { Route, Routes } from 'react-router-dom';

import { AboutPage } from '@/pages/about';
import { AccountsPage } from '@/pages/accounts';
import { HomePage } from '@/pages/home';
import { LoginPage } from '@/pages/login';
import { NotFoundPage } from '@/pages/not-found';
import { RegisterPage } from '@/pages/register';
import { ViewerPage } from '@/pages/viewer';
import { RequireAuth } from './RequireAuth';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/accounts"
        element={
          <RequireAuth>
            <AccountsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/viewer"
        element={
          <RequireAuth>
            <ViewerPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
