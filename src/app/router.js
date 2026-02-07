import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Loader } from 'lucide-react';

import PublicLayout from '../components/layout/PublicLayout';
import AuthLayout from '../components/layout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import { AuthGuard, GuestGuard, PermissionGuard } from '../auth/guards';

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader className="w-6 h-6 text-primary animate-spin" />
  </div>
);

const Lazy = ({ children }) => <Suspense fallback={<PageLoader />}>{children}</Suspense>;

/* Lazy-loaded pages */
const LandingPage = lazy(() => import('../pages/public/LandingPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const DashboardHome = lazy(() => import('../pages/dashboard/DashboardHome'));
const ProfilePage = lazy(() => import('../pages/dashboard/ProfilePage'));
const UsersListPage = lazy(() => import('../pages/dashboard/users/UsersListPage'));
const UserDetailsPage = lazy(() => import('../pages/dashboard/users/UserDetailsPage'));
const UserCreatePage = lazy(() => import('../pages/dashboard/users/UserCreatePage'));
const UserEditPage = lazy(() => import('../pages/dashboard/users/UserEditPage'));
const UnderDevelopmentPage = lazy(() => import('../pages/shared/UnderDevelopmentPage'));
const NotFoundPage = lazy(() => import('../pages/shared/NotFoundPage'));

const router = createBrowserRouter([
  /* ══════════ Public ══════════ */
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <Lazy><LandingPage /></Lazy> },
    ],
  },

  /* ══════════ Auth (Guest Only) ══════════ */
  {
    element: <GuestGuard><AuthLayout /></GuestGuard>,
    children: [
      { path: 'auth/login', element: <Lazy><LoginPage /></Lazy> },
    ],
  },

  /* ══════════ Dashboard (Protected) ══════════ */
  {
    path: 'dashboard',
    element: <AuthGuard><DashboardLayout /></AuthGuard>,
    children: [
      { index: true, element: <Lazy><DashboardHome /></Lazy> },
      {
        path: 'profile',
        element: (
          <PermissionGuard required={['AUTH_VIEW_SELF']}>
            <Lazy><ProfilePage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <PermissionGuard required={['USERS_VIEW']}>
            <Lazy><UsersListPage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'users/new',
        element: (
          <PermissionGuard required={['USERS_CREATE']}>
            <Lazy><UserCreatePage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'users/:id',
        element: (
          <PermissionGuard required={['USERS_VIEW']}>
            <Lazy><UserDetailsPage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'users/:id/edit',
        element: (
          <PermissionGuard required={['USERS_UPDATE']}>
            <Lazy><UserEditPage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'under-development',
        element: <Lazy><UnderDevelopmentPage /></Lazy>,
      },
    ],
  },

  /* ══════════ 404 ══════════ */
  { path: '*', element: <Lazy><NotFoundPage /></Lazy> },
]);

export default router;
