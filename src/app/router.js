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
const FamilyHouseLookupPage = lazy(() => import('../pages/dashboard/users/FamilyHouseLookupPage'));
const UserDetailsPage = lazy(() => import('../pages/dashboard/users/UserDetailsPage'));
const UserCreatePage = lazy(() => import('../pages/dashboard/users/UserCreatePage'));
const UserEditPage = lazy(() => import('../pages/dashboard/users/UserEditPage'));
const ConfessionSessionsPage = lazy(() => import('../pages/dashboard/confessions/ConfessionSessionsPage'));
const ConfessionAlertsPage = lazy(() => import('../pages/dashboard/confessions/ConfessionAlertsPage'));
const ConfessionAnalyticsPage = lazy(() => import('../pages/dashboard/confessions/ConfessionAnalyticsPage'));
const PastoralVisitationListPage = lazy(() => import('../pages/dashboard/visitations/PastoralVisitationListPage'));
const PastoralVisitationCreatePage = lazy(() => import('../pages/dashboard/visitations/PastoralVisitationCreatePage'));
const PastoralVisitationDetailsPage = lazy(() => import('../pages/dashboard/visitations/PastoralVisitationDetailsPage'));
const PastoralVisitationAnalyticsPage = lazy(() => import('../pages/dashboard/visitations/PastoralVisitationAnalyticsPage'));
const MeetingsPage = lazy(() => import('../pages/dashboard/meetings/MeetingsPage'));
const SectorFormPage = lazy(() => import('../pages/dashboard/meetings/SectorFormPage'));
const MeetingFormPage = lazy(() => import('../pages/dashboard/meetings/MeetingFormPage'));
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
        path: 'users/family-house',
        element: (
          <PermissionGuard required={['USERS_VIEW']}>
            <Lazy><FamilyHouseLookupPage /></Lazy>
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
        path: 'confessions',
        element: (
          <PermissionGuard required={['CONFESSIONS_VIEW']}>
            <Lazy><ConfessionSessionsPage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'confessions/alerts',
        element: (
          <PermissionGuard required={['CONFESSIONS_ALERTS_VIEW']}>
            <Lazy><ConfessionAlertsPage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'confessions/analytics',
        element: (
          <PermissionGuard required={['CONFESSIONS_ANALYTICS_VIEW']}>
            <Lazy><ConfessionAnalyticsPage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'visitations',
        element: (
          <PermissionGuard required={['PASTORAL_VISITATIONS_VIEW']}>
            <Lazy><PastoralVisitationListPage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'visitations/new',
        element: (
          <PermissionGuard required={['PASTORAL_VISITATIONS_CREATE']}>
            <Lazy><PastoralVisitationCreatePage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'visitations/analytics',
        element: (
          <PermissionGuard required={['PASTORAL_VISITATIONS_ANALYTICS_VIEW']}>
            <Lazy><PastoralVisitationAnalyticsPage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'visitations/:id',
        element: (
          <PermissionGuard required={['PASTORAL_VISITATIONS_VIEW']}>
            <Lazy><PastoralVisitationDetailsPage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'meetings',
        element: (
          <PermissionGuard required={['SECTORS_VIEW', 'MEETINGS_VIEW']} mode="any">
            <Lazy><MeetingsPage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'meetings/sectors/new',
        element: (
          <PermissionGuard required={['SECTORS_CREATE']}>
            <Lazy><SectorFormPage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'meetings/sectors/:id/edit',
        element: (
          <PermissionGuard required={['SECTORS_UPDATE']}>
            <Lazy><SectorFormPage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'meetings/new',
        element: (
          <PermissionGuard required={['MEETINGS_CREATE']}>
            <Lazy><MeetingFormPage /></Lazy>
          </PermissionGuard>
        ),
      },
      {
        path: 'meetings/:id/edit',
        element: (
          <PermissionGuard
            required={[
              'MEETINGS_UPDATE',
              'MEETINGS_SERVANTS_MANAGE',
              'MEETINGS_COMMITTEES_MANAGE',
              'MEETINGS_ACTIVITIES_MANAGE',
            ]}
            mode="any"
          >
            <Lazy><MeetingFormPage /></Lazy>
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
