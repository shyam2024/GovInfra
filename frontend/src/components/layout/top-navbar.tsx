import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from './app-sidebar';
import { NotificationBell } from './notification-bell';
import { UserMenu } from './user-menu';
import type { Crumb } from './breadcrumb';
import { Breadcrumb } from './breadcrumb';

export function TopNavbar({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
      <Sheet>
        <SheetTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AppSidebar inSheet />
        </SheetContent>
      </Sheet>

      <Breadcrumb items={crumbs} />

      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
