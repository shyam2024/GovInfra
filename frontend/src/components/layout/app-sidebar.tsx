import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  ClipboardCheck,
  Receipt,
  Workflow,
  Landmark,
  BarChart3,
  Building2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';
import { SheetClose } from '@/components/ui/sheet';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/progress', label: 'Progress', icon: ClipboardList, roles: ['CONTRACTOR', 'ADMIN'] },
  { to: '/inspections', label: 'Inspections', icon: ClipboardCheck, roles: ['ENGINEER', 'ADMIN'] },
  { to: '/billing', label: 'RA Bills', icon: Receipt, roles: ['CONTRACTOR', 'FINANCE', 'ADMIN'] },
  { to: '/workflow', label: 'File Tracking', icon: Workflow },
  { to: '/treasury', label: 'Treasury', icon: Landmark, roles: ['TREASURY', 'ADMIN'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['ADMIN'] },
];

interface AppSidebarProps {
  /** When rendered inside the mobile Sheet, links close the drawer on tap. */
  inSheet?: boolean;
}

export function AppSidebar({ inSheet }: AppSidebarProps) {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  const Wrapper = inSheet ? SheetClose : 'div';
  const wrapperProps = inSheet ? { asChild: true as const } : {};

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary">
          <Building2 className="size-4 text-white" aria-hidden />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">GovInfra</p>
          <p className="text-[11px] text-slate-400">Gujarat</p>
        </div>
        {inSheet && (
          <SheetClose className="ml-auto rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close menu">
            <X className="size-4" />
          </SheetClose>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {items.map((item) => (
          <Wrapper key={item.to} {...wrapperProps}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white',
                  isActive && 'bg-primary/90 text-white hover:bg-primary/90',
                )
              }
            >
              <item.icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </NavLink>
          </Wrapper>
        ))}
      </nav>

      {user && (
        <div className="border-t border-white/10 px-4 py-3">
          <p className="truncate text-xs font-medium text-white">{user.full_name}</p>
          <p className="text-[11px] text-slate-400">{ROLE_LABELS[user.role]}</p>
        </div>
      )}
    </div>
  );
}
