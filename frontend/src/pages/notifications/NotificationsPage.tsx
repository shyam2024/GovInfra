import { useMemo } from 'react';
import { CheckCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/tables/empty-state';
import { TableSkeleton } from '@/components/tables/loading-skeleton';
import { useMarkAllRead, useMarkRead, useNotifications } from '@/hooks/useNotifications';
import { dayGroup, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

export function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const groups = useMemo(() => {
    const buckets: Record<string, Notification[]> = { Today: [], Yesterday: [], Earlier: [] };
    for (const n of notifications) buckets[dayGroup(n.created_at)].push(n);
    return buckets;
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        description="Updates on files, bills, and payments that involve you"
        actions={
          unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
              <CheckCheck /> Mark all read
            </Button>
          )
        }
      />

      {isLoading ? (
        <TableSkeleton rows={4} cols={1} />
      ) : notifications.length === 0 ? (
        <EmptyState title="You're all caught up" description="New notifications will appear here." />
      ) : (
        <div className="space-y-6">
          {(['Today', 'Yesterday', 'Earlier'] as const).map(
            (label) =>
              groups[label].length > 0 && (
                <div key={label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <div className="divide-y divide-border rounded-lg border border-border bg-card">
                    {groups[label].map((n) => (
                      <div key={n.id} className={cn('flex items-start justify-between gap-3 px-4 py-3', !n.is_read && 'bg-blue-50/50')}>
                        <div>
                          <p className="text-sm font-medium text-foreground">{n.title}</p>
                          <p className="text-sm text-muted-foreground">{n.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
                        </div>
                        {!n.is_read && (
                          <Button variant="ghost" size="sm" onClick={() => markRead.mutate(n.id)}>
                            Mark read
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ),
          )}
        </div>
      )}
    </div>
  );
}
