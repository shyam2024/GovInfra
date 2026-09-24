import { Bell, Check, CheckCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useMarkAllRead, useMarkRead, useNotifications } from '@/hooks/useNotifications';
import { dayGroup, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const groups = useMemo(() => {
    const buckets: Record<string, Notification[]> = { Today: [], Yesterday: [], Earlier: [] };
    for (const n of notifications) buckets[dayGroup(n.created_at)].push(n);
    return buckets;
  }, [notifications]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
          <Bell className="size-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <div className="max-h-96 overflow-y-auto">
          {isLoading && <p className="px-3 py-6 text-center text-xs text-muted-foreground">Loading…</p>}
          {!isLoading && notifications.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">You're all caught up.</p>
          )}
          {(['Today', 'Yesterday', 'Earlier'] as const).map(
            (label) =>
              groups[label].length > 0 && (
                <div key={label}>
                  <DropdownMenuLabel>{label}</DropdownMenuLabel>
                  {groups[label].map((n) => (
                    <div key={n.id} className={cn('flex items-start gap-2 px-3 py-2 text-sm', !n.is_read && 'bg-blue-50/60')}>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDateTime(n.created_at)}</p>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={() => markRead.mutate(n.id)}
                          className="mt-0.5 shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label="Mark as read"
                        >
                          <Check className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ),
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
