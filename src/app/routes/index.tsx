import { AboutPage } from '@/pages/about';
import { AccountsPage } from '@/pages/accounts';
import { DashboardPage } from '@/pages/dashboard';
import { FileViewPage } from '@/pages/file-view';
import { ForgotPasswordPage } from '@/pages/forgot-password';
import { HomePage } from '@/pages/home';
import { LoginPage } from '@/pages/login';
import { NotFoundPage } from '@/pages/not-found';
import { NotificationsPage } from '@/pages/notifications';
import { OrganizationsPage } from '@/pages/organizations';
import { PlaceholderPage } from '@/pages/placeholder';
import { ProfilePage } from '@/pages/profile';
import { ProjectDetailPage } from '@/pages/project-detail';
import { ProjectsPage } from '@/pages/projects';
import { RegisterPage } from '@/pages/register';
import { ReturnRequestManagementPage } from '@/pages/return-request-management';
import { ResetPasswordPage } from '@/pages/reset-password';
import { VerifyOtpPage } from '@/pages/verify-otp';
import { ViewerPage } from '@/pages/viewer';
import { AdminLayout } from '@/widgets/AdminLayout';
import { Route, Routes } from 'react-router-dom';
import { RequireAdmin } from './RequireAdmin';
import { RequireAuth } from './RequireAuth';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/accounts"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminLayout>
                <AccountsPage />
              </AdminLayout>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/organizations"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminLayout>
                <OrganizationsPage />
              </AdminLayout>
            </RequireAdmin>
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
      <Route
        path="/projects"
        element={
          <RequireAuth>
            <AdminLayout>
              <ProjectsPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <RequireAuth>
            <AdminLayout>
              <ProjectDetailPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/zone-return-requests"
        element={
          <RequireAuth>
            <AdminLayout>
              <ReturnRequestManagementPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <AdminLayout>
              <NotificationsPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/teams"
        element={
          <RequireAuth>
            <AdminLayout>
              <PlaceholderPage
                titleKey="placeholder.teams.title"
                descKey="placeholder.teams.desc"
              />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/documents"
        element={
          <RequireAuth>
            <AdminLayout>
              <PlaceholderPage
                titleKey="placeholder.documents.title"
                descKey="placeholder.documents.desc"
              />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/discussions"
        element={
          <RequireAuth>
            <AdminLayout>
              <PlaceholderPage
                titleKey="placeholder.discussions.title"
                descKey="placeholder.discussions.desc"
              />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <AdminLayout>
              <PlaceholderPage
                titleKey="placeholder.settings.title"
                descKey="placeholder.settings.desc"
              />
            </AdminLayout>
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
      <Route
        path="/projects/:projectId/files/:fileId/view"
        element={
          <RequireAuth>
            <AdminLayout>
              <FileViewPage />
            </AdminLayout>
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
