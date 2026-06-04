import { Route, Routes } from 'react-router-dom';

import { AboutPage } from '@/pages/about';
import { AccountsPage } from '@/pages/accounts';
import { HomePage } from '@/pages/home';
import { LoginPage } from '@/pages/login';
import { NotFoundPage } from '@/pages/not-found';
import { OrganizationsPage } from '@/pages/organizations';
import { ProfilePage } from '@/pages/profile';
import { RegisterPage } from '@/pages/register';
import { AdminLayout } from '@/widgets/AdminLayout';
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
            <AdminLayout>
              <AccountsPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/organizations"
        element={
          <RequireAuth>
            <AdminLayout>
              <OrganizationsPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <AdminLayout>
              <ProfilePage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
