import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/tables/empty-state';
import { formatDateTime } from '@/lib/format';
import type { WorkflowHistory } from '@/types';

interface TimelineProps {
  entries: WorkflowHistory[];
  isLoading?: boolean;
}

/** Vertical workflow timeline — officer, department, action, timestamp, remarks per entry. The primary demo component. */
export function Timeline({ entries, isLoading }: TimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) return <EmptyState title="No history yet" description="Actions on this file will appear here." />;

  return (
    <ol className="relative border-l border-border pl-5">
      {entries.map((entry, i) => (
        <li key={entry.id} className="mb-6 last:mb-0">
          <span
            className={
              'absolute -left-[7px] flex size-3.5 items-center justify-center rounded-full border-2 border-card ' +
              (i === 0 ? 'bg-primary' : 'bg-slate-300')
            }
            aria-hidden
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <p className="text-sm font-semibold text-foreground">{entry.action}</p>
            <time className="text-xs text-muted-foreground">{formatDateTime(entry.timestamp)}</time>
          </div>
          <p className="text-xs text-muted-foreground">
            {entry.officer} · {entry.department}
          </p>
          {entry.remarks && <p className="mt-1 rounded-md bg-muted/60 px-2.5 py-1.5 text-sm text-foreground">{entry.remarks}</p>}
        </li>
      ))}
    </ol>
  );
}
