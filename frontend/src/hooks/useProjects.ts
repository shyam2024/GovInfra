import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/services/api';
import { projectsService } from '@/services/projects';
import type { Id, ProjectCreatePayload } from '@/types';

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: Id) => ['projects', id] as const,
  contractors: ['contractors'] as const,
};

export const useProjects = () => useQuery({ queryKey: projectKeys.all, queryFn: projectsService.list });

export const useProject = (id?: Id) =>
  useQuery({ queryKey: projectKeys.detail(id ?? ''), queryFn: () => projectsService.get(id as Id), enabled: id !== undefined });

export const useContractors = () => useQuery({ queryKey: projectKeys.contractors, queryFn: projectsService.contractors });

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectCreatePayload) => projectsService.create(payload),
    onSuccess: () => {
      toast.success('Project created');
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
