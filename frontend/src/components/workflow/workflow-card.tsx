import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WorkflowFile } from '@/types';

const PRIORITY_TONE: Record<string, 'neutral' | 'primary' | 'warning' | 'danger'> = {
  LOW: 'neutral',
  MEDIUM: 'primary',
  HIGH: 'warning',
  URGENT: 'danger',
};

interface WorkflowCardProps {
  file: WorkflowFile;
  onClick: () => void;
}

/** File Number, Project, Priority, Current Holder, Days Pending — one Kanban card. */
export function WorkflowCard({ file, onClick }: WorkflowCardProps) {
  const overdue = file.days_pending > 7;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-md border border-border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{file.file_number}</p>
        <Badge tone={PRIORITY_TONE[file.priority] ?? 'neutral'}>{file.priority}</Badge>
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{file.project_name}</p>
      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className="truncate text-muted-foreground">{file.current_holder}</span>
        <span className={cn('flex items-center gap-1 font-medium', overdue ? 'text-danger' : 'text-muted-foreground')}>
          <Clock className="size-3" aria-hidden />
          {file.days_pending}d
        </span>
      </div>
    </button>
  );
}
