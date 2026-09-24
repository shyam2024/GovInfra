import { api, unwrapList } from './api';
import type { Id, Notification } from '@/types';

export const notificationsService = {
  async list(): Promise<Notification[]> {
    const { data } = await api.get('/notifications');
    return unwrapList<Notification>(data);
  },
  async markRead(id: Id): Promise<void> {
    await api.post(`/notifications/${id}/read`);
  },
  async markAllRead(): Promise<void> {
    await api.post('/notifications/read-all');
  },
};
