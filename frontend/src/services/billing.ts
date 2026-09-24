import { api, unwrapList } from './api';
import type { Id, RABill, RABillPayload } from '@/types';

export const billingService = {
  async list(projectId?: Id): Promise<RABill[]> {
    const { data } = await api.get('/ra-bills', { params: projectId ? { project_id: projectId } : undefined });
    return unwrapList<RABill>(data);
  },
  async create(payload: RABillPayload): Promise<RABill> {
    const { data } = await api.post<RABill>('/ra-bills', payload);
    return data;
  },
  async submit(id: Id): Promise<RABill> {
    const { data } = await api.post<RABill>(`/ra-bills/${id}/submit`);
    return data;
  },
};
