import { api, unwrapList } from './api';
import type { Id, Payment } from '@/types';

export const treasuryService = {
  async queue(): Promise<Payment[]> {
    const { data } = await api.get('/payments');
    return unwrapList<Payment>(data);
  },
  async release(paymentId: Id): Promise<Payment> {
    const { data } = await api.post<Payment>(`/payments/${paymentId}/release`);
    return data;
  },
};
