import { useLocation, useParams } from 'react-router-dom';
import type { Crumb } from '@/components/layout/breadcrumb';

const LABELS: Record<string, string> = {
  '': 'Dashboard',
  projects: 'Projects',
  progress: 'Progress',
  inspections: 'Inspections',
  billing: 'RA Bills',
  workflow: 'File Tracking',
  treasury: 'Treasury',
  analytics: 'Analytics',
  notifications: 'Notifications',
  new: 'New',
};

/** Builds breadcrumbs from the URL; a project detail segment is swapped for "Project #<id>" since we don't have its name here. */
export function useBreadcrumbs(): Crumb[] {
  const location = useLocation();
  const params = useParams();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return [{ label: 'Dashboard' }];

  const crumbs: Crumb[] = [{ label: 'Dashboard', to: '/' }];
  let path = '';
  segments.forEach((seg, i) => {
    path += `/${seg}`;
    const isLast = i === segments.length - 1;
    const isIdParam = params.id === seg;
    const label = isIdParam ? `Project #${seg}` : (LABELS[seg] ?? seg);
    crumbs.push({ label, to: isLast ? undefined : path });
  });
  return crumbs;
}
