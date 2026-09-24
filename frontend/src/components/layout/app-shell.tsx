import { Outlet } from 'react-router-dom';
import { AppSidebar } from './app-sidebar';
import { TopNavbar } from './top-navbar';
import { useBreadcrumbs } from '@/routes/useBreadcrumbs';

export function AppShell() {
  const crumbs = useBreadcrumbs();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-60 shrink-0 lg:block">
        <AppSidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar crumbs={crumbs} />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
