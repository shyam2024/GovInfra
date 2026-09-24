import { api, unwrapList } from './api';
import type { Id, ProgressLog, ProgressPayload } from '@/types';

export const progressService = {
  async list(projectId?: Id): Promise<ProgressLog[]> {
    const { data } = await api.get('/progress', { params: projectId ? { project_id: projectId } : undefined });
    return unwrapList<ProgressLog>(data);
  },
  async create(payload: ProgressPayload): Promise<ProgressLog> {
    const { data } = await api.post<ProgressLog>('/progress', payload);
    return data;
  },
};
