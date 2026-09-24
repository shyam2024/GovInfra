import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/services/api';
import { treasuryService } from '@/services/treasury';
import type { Id } from '@/types';

export const usePaymentQueue = () => useQuery({ queryKey: ['payments'], queryFn: treasuryService.queue });

export function useReleasePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Id) => treasuryService.release(id),
    onSuccess: () => {
      toast.success('Payment released');
      // Refresh dashboard (and everything the payment touches) automatically.
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['workflow'] });
      qc.invalidateQueries({ queryKey: ['bills'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
