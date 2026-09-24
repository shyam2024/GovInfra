import { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { StatusBadge } from '@/components/tables/status-badge';
import { Timeline } from '@/components/workflow/timeline';
import { useApproveFile, useReturnFile, useWorkflowHistory } from '@/hooks/useWorkflow';
import { useAuth } from '@/contexts/AuthContext';
import { STAGE_OWNER } from '@/lib/constants';
import type { WorkflowFile } from '@/types';

interface WorkflowDrawerProps {
  file: WorkflowFile | null;
  onClose: () => void;
}

export function WorkflowDrawer({ file, onClose }: WorkflowDrawerProps) {
  const { user } = useAuth();
  const [remarks, setRemarks] = useState('');
  const { data: history = [], isLoading } = useWorkflowHistory(file?.id);
  const approve = useApproveFile();
  const returnFile = useReturnFile();

  const canAct = !!file && !!user && (user.role === 'ADMIN' || STAGE_OWNER[file.current_stage] === user.role) && file.current_stage !== 'PAID';

  const handleApprove = async () => {
    if (!file) return;
    await approve.mutateAsync({ id: file.id, remarks: remarks || undefined });
    setRemarks('');
    onClose();
  };

  const handleReturn = async () => {
    if (!file || !remarks.trim()) return;
    await returnFile.mutateAsync({ id: file.id, remarks });
    setRemarks('');
    onClose();
  };

  return (
    <Sheet open={!!file} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        {file && (
          <>
            <SheetHeader>
              <SheetTitle>{file.file_number}</SheetTitle>
              <SheetDescription>{file.project_name}</SheetDescription>
              <div className="flex items-center gap-2 pt-1">
                <StatusBadge status={file.current_stage} />
                <span className="text-xs text-muted-foreground">Held by {file.current_holder}</span>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4">
              {file.remarks && (
                <div className="mb-4 rounded-md border border-border bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Current remarks</p>
                  <p className="mt-0.5 text-sm text-foreground">{file.remarks}</p>
                </div>
              )}
              <h3 className="mb-3 text-sm font-semibold text-foreground">Timeline</h3>
              <Timeline entries={history} isLoading={isLoading} />
            </div>

            {canAct && (
              <SheetFooter className="flex-col items-stretch gap-3">
                <FormField label="Remarks" htmlFor="drawer-remarks" hint="Required to return a file">
                  <Textarea id="drawer-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add a note for the next officer…" />
                </FormField>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleReturn} loading={returnFile.isPending} disabled={!remarks.trim()}>
                    <RotateCcw /> Return
                  </Button>
                  <Button className="flex-1" onClick={handleApprove} loading={approve.isPending}>
                    <Check /> Approve
                  </Button>
                </div>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
