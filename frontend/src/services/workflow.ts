import { api, unwrapList } from './api';
import type { Id, WorkflowActionPayload, WorkflowFile, WorkflowHistory } from '@/types';

export const workflowService = {
  async files(projectId?: Id): Promise<WorkflowFile[]> {
    const { data } = await api.get('/workflow/files', { params: projectId ? { project_id: projectId } : undefined });
    return unwrapList<WorkflowFile>(data);
  },
  async history(fileId: Id): Promise<WorkflowHistory[]> {
    const { data } = await api.get(`/workflow/files/${fileId}/history`);
    return unwrapList<WorkflowHistory>(data);
  },
  async approve(fileId: Id, payload: WorkflowActionPayload = {}): Promise<WorkflowFile> {
    const { data } = await api.post<WorkflowFile>(`/workflow/files/${fileId}/approve`, payload);
    return data;
  },
  async returnFile(fileId: Id, payload: WorkflowActionPayload): Promise<WorkflowFile> {
    const { data } = await api.post<WorkflowFile>(`/workflow/files/${fileId}/return`, payload);
    return data;
  },
};
