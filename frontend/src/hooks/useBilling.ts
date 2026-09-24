import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/services/api';
import { billingService } from '@/services/billing';
import type { Id, RABillPayload } from '@/types';

export const useBills = (projectId?: Id) =>
  useQuery({ queryKey: ['bills', projectId ?? 'all'], queryFn: () => billingService.list(projectId) });

function useInvalidateBilling() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['bills'] });
    qc.invalidateQueries({ queryKey: ['workflow'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreateBill() {
  const invalidate = useInvalidateBilling();
  return useMutation({
    mutationFn: (payload: RABillPayload) => billingService.create(payload),
    onSuccess: invalidate,
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useSubmitBill() {
  const invalidate = useInvalidateBilling();
  return useMutation({
    mutationFn: (id: Id) => billingService.submit(id),
    onSuccess: invalidate,
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
