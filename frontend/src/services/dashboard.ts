import axios from 'axios';
import { api } from './api';
import type { DashboardSummary } from '@/types';

export const dashboardService = {
  async summary(): Promise<DashboardSummary> {
    const { data } = await api.get<DashboardSummary>('/dashboard');
    return data;
  },
  /** Chart data. Falls back to the summary payload if the backend has no dedicated analytics route. */
  async analytics(): Promise<DashboardSummary> {
    try {
      const { data } = await api.get<DashboardSummary>('/dashboard/analytics');
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) return dashboardService.summary();
      throw err;
    }
  },
};
