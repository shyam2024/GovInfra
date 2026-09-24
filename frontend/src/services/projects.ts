import { api, unwrapList } from './api';
import type { Contractor, Id, Project, ProjectCreatePayload } from '@/types';

export const projectsService = {
  async list(): Promise<Project[]> {
    const { data } = await api.get('/projects');
    return unwrapList<Project>(data);
  },
  async get(id: Id): Promise<Project> {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },
  async create(payload: ProjectCreatePayload): Promise<Project> {
    const { data } = await api.post<Project>('/projects', payload);
    return data;
  },
  async contractors(): Promise<Contractor[]> {
    const { data } = await api.get('/contractors');
    return unwrapList<Contractor>(data);
  },
};
