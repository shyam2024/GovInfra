import { api, unwrapList } from './api';
import type { Id, Inspection, InspectionPayload } from '@/types';

export const inspectionsService = {
  async list(projectId?: Id): Promise<Inspection[]> {
    const { data } = await api.get('/inspections', { params: projectId ? { project_id: projectId } : undefined });
    return unwrapList<Inspection>(data);
  },
  async create(payload: InspectionPayload): Promise<Inspection> {
    const { data } = await api.post<Inspection>('/inspections', payload);
    return data;
  },
};
