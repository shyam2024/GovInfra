import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/services/api';
import { progressService } from '@/services/progress';
import type { Id, ProgressPayload } from '@/types';

export const useProgressLogs = (projectId?: Id) =>
  useQuery({ queryKey: ['progress', projectId ?? 'all'], queryFn: () => progressService.list(projectId) });

export function useSubmitProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProgressPayload) => progressService.create(payload),
    onSuccess: () => {
      toast.success('Progress submitted');
      qc.invalidateQueries({ queryKey: ['progress'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
