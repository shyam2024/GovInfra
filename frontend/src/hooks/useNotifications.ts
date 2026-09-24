import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/services/api';
import { notificationsService } from '@/services/notifications';
import { toast } from 'sonner';
import type { Id } from '@/types';

export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: notificationsService.list, refetchInterval: 30_000 });

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Id) => notificationsService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
