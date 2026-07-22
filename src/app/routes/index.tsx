import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { NotFoundPage } from '@/pages/not-found';
import { PlaceholderPage } from '@/pages/placeholder';
import { AdminLayout } from '@/widgets/AdminLayout';
import { RequireAdmin } from './RequireAdmin';
import { RequireAuth } from './RequireAuth';

/* Lazy-load từng trang -> mỗi trang là 1 chunk riêng, chỉ tải khi điều hướng tới. Giảm mạnh bundle
 * khởi động (trước đây import tĩnh mọi trang, kể cả APS Viewer nặng). Shell + guard + NotFound +
 * Placeholder giữ import tĩnh vì nhỏ và dùng ở hầu hết route. lazy() cần default export nên với
 * named export phải map lại qua .then(). */
const HomePage = lazy(() => import('@/pages/home').then((m) => ({ default: m.HomePage })));
const AboutPage = lazy(() => import('@/pages/about').then((m) => ({ default: m.AboutPage })));
const LoginPage = lazy(() => import('@/pages/login').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/register').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/forgot-password').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/reset-password').then((m) => ({ default: m.ResetPasswordPage })));
const VerifyOtpPage = lazy(() => import('@/pages/verify-otp').then((m) => ({ default: m.VerifyOtpPage })));
const DashboardPage = lazy(() => import('@/pages/dashboard').then((m) => ({ default: m.DashboardPage })));
const AccountsPage = lazy(() => import('@/pages/accounts').then((m) => ({ default: m.AccountsPage })));
const OrganizationsPage = lazy(() => import('@/pages/organizations').then((m) => ({ default: m.OrganizationsPage })));
const ProfilePage = lazy(() => import('@/pages/profile').then((m) => ({ default: m.ProfilePage })));
const ProjectsPage = lazy(() => import('@/pages/projects').then((m) => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('@/pages/project-detail').then((m) => ({ default: m.ProjectDetailPage })));
const PackageDetailPage = lazy(() => import('@/pages/package-detail').then((m) => ({ default: m.PackageDetailPage })));
const ReturnRequestManagementPage = lazy(() => import('@/pages/return-request-management').then((m) => ({ default: m.ReturnRequestManagementPage })));
const NotificationsPage = lazy(() => import('@/pages/notifications').then((m) => ({ default: m.NotificationsPage })));
const ViewerPage = lazy(() => import('@/pages/viewer').then((m) => ({ default: m.ViewerPage })));
const FileViewPage = lazy(() => import('@/pages/file-view').then((m) => ({ default: m.FileViewPage })));
const IssueDetailPage = lazy(() => import('@/pages/issue-detail').then((m) => ({ default: m.IssueDetailPage })));

/* Fallback toàn màn hình cho các trang KHÔNG bọc AdminLayout (login/home/viewer). Trang trong
 * AdminLayout có Suspense riêng ở vùng nội dung (shell không nhấp nháy). */
function FullPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-content-bg">
      <svg className="h-9 w-9 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
      </svg>
    </div>
  );
}

export const AppRoutes = () => {
  return (
    <Suspense fallback={<FullPageFallback />}>
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
          path="/projects/:projectId/packages/:packageId"
          element={
            <RequireAuth>
              <AdminLayout>
                <PackageDetailPage />
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
        <Route
          path="/projects/:projectId/files/:fileId/issues/:issueId"
          element={
            <RequireAuth>
              <AdminLayout>
                <IssueDetailPage />
              </AdminLayout>
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
