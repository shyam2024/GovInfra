import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/services/api';
import { workflowService } from '@/services/workflow';
import type { Id } from '@/types';

export const useWorkflowFiles = (projectId?: Id) =>
  useQuery({ queryKey: ['workflow', 'files', projectId ?? 'all'], queryFn: () => workflowService.files(projectId) });

export const useWorkflowHistory = (fileId?: Id) =>
  useQuery({
    queryKey: ['workflow', 'history', fileId],
    queryFn: () => workflowService.history(fileId as Id),
    enabled: fileId !== undefined && fileId !== null,
  });

function useInvalidateWorkflow() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['workflow'] });
    qc.invalidateQueries({ queryKey: ['bills'] });
    qc.invalidateQueries({ queryKey: ['payments'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };
}

export function useApproveFile() {
  const invalidate = useInvalidateWorkflow();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: Id; remarks?: string }) => workflowService.approve(id, { remarks }),
    onSuccess: () => {
      toast.success('File approved and forwarded');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useReturnFile() {
  const invalidate = useInvalidateWorkflow();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: Id; remarks: string }) => workflowService.returnFile(id, { remarks }),
    onSuccess: () => {
      toast.success('File returned with remarks');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
