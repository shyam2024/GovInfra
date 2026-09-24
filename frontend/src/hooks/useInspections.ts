import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/services/api';
import { inspectionsService } from '@/services/inspections';
import type { Id, InspectionPayload } from '@/types';

export const useInspections = (projectId?: Id) =>
  useQuery({ queryKey: ['inspections', projectId ?? 'all'], queryFn: () => inspectionsService.list(projectId) });

export function useCreateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InspectionPayload) => inspectionsService.create(payload),
    onSuccess: () => {
      toast.success('Inspection recorded');
      qc.invalidateQueries({ queryKey: ['inspections'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
