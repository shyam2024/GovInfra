import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProjectListPage } from '@/pages/projects/ProjectListPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { CreateProjectPage } from '@/pages/projects/CreateProjectPage';
import { ProgressPage } from '@/pages/progress/ProgressPage';
import { InspectionsPage } from '@/pages/inspections/InspectionsPage';
import { BillingPage } from '@/pages/billing/BillingPage';
import { WorkflowPage } from '@/pages/workflow/WorkflowPage';
import { TreasuryPage } from '@/pages/treasury/TreasuryPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/projects', element: <ProjectListPage /> },
          { path: '/projects/:id', element: <ProjectDetailPage /> },
          { element: <ProtectedRoute allow={['ADMIN']} />, children: [{ path: '/projects/new', element: <CreateProjectPage /> }] },
          { element: <ProtectedRoute allow={['CONTRACTOR', 'ADMIN']} />, children: [{ path: '/progress', element: <ProgressPage /> }] },
          { element: <ProtectedRoute allow={['ENGINEER', 'ADMIN']} />, children: [{ path: '/inspections', element: <InspectionsPage /> }] },
          { element: <ProtectedRoute allow={['CONTRACTOR', 'FINANCE', 'ADMIN']} />, children: [{ path: '/billing', element: <BillingPage /> }] },
          { path: '/workflow', element: <WorkflowPage /> },
          { element: <ProtectedRoute allow={['TREASURY', 'ADMIN']} />, children: [{ path: '/treasury', element: <TreasuryPage /> }] },
          { path: '/notifications', element: <NotificationsPage /> },
          { element: <ProtectedRoute allow={['ADMIN']} />, children: [{ path: '/analytics', element: <AnalyticsPage /> }] },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
