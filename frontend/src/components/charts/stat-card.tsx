import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'primary' | 'secondary' | 'accent' | 'warning' | 'success' | 'danger';
  isLoading?: boolean;
  hint?: string;
}

const TONE_BG: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: 'bg-blue-50 text-primary',
  secondary: 'bg-teal-50 text-secondary',
  accent: 'bg-violet-50 text-accent',
  warning: 'bg-amber-50 text-warning',
  success: 'bg-green-50 text-success',
  danger: 'bg-red-50 text-danger',
};

export function StatCard({ label, value, icon: Icon, tone = 'primary', isLoading, hint }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1.5 h-7 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
          )}
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-md', TONE_BG[tone])}>
          <Icon className="size-[18px]" aria-hidden />
        </div>
      </div>
    </div>
  );
}
