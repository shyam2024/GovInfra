import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';

export const useDashboardSummary = () =>
  useQuery({ queryKey: ['dashboard', 'summary'], queryFn: dashboardService.summary, refetchInterval: 60_000 });

export const useAnalytics = () => useQuery({ queryKey: ['dashboard', 'analytics'], queryFn: dashboardService.analytics });
