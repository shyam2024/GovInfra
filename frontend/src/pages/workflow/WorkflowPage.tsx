import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { WorkflowCard } from '@/components/workflow/workflow-card';
import { WorkflowDrawer } from './WorkflowDrawer';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/tables/empty-state';
import { WORKFLOW_STAGES } from '@/lib/constants';
import { useWorkflowFiles } from '@/hooks/useWorkflow';
import type { WorkflowFile, WorkflowStage } from '@/types';

export function WorkflowPage() {
  const { data: files = [], isLoading } = useWorkflowFiles();
  const [selected, setSelected] = useState<WorkflowFile | null>(null);

  const byStage = useMemo(() => {
    const map = new Map<WorkflowStage, WorkflowFile[]>();
    for (const stage of WORKFLOW_STAGES) map.set(stage.key, []);
    for (const f of files) {
      const bucket = map.get(f.current_stage as WorkflowStage);
      if (bucket) bucket.push(f);
      else map.set(f.current_stage as WorkflowStage, [f]);
    }
    return map;
  }, [files]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="File Tracking" description="Government file workflow — Submitted → Engineer → Finance → Treasury → Paid" />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {WORKFLOW_STAGES.map((s) => (
            <Skeleton key={s.key} className="h-64 w-full" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <EmptyState title="No files in the workflow" description="Files created from submitted RA bills will appear here." />
      ) : (
        <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5">
          {WORKFLOW_STAGES.map((stage) => {
            const items = byStage.get(stage.key) ?? [];
            return (
              <div key={stage.key} className="flex min-w-0 flex-col rounded-lg bg-muted/40 p-2.5">
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className={`size-2 rounded-full ${stage.accent}`} aria-hidden />
                  <p className="text-sm font-semibold text-foreground">{stage.label}</p>
                  <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.length === 0 ? (
                    <p className="px-1 py-4 text-center text-xs text-muted-foreground">No files</p>
                  ) : (
                    items.map((file) => <WorkflowCard key={file.id} file={file} onClick={() => setSelected(file)} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <WorkflowDrawer file={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
