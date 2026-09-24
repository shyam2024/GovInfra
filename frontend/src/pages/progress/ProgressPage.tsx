import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/tables/data-table';
import { useProjects } from '@/hooks/useProjects';
import { useProgressLogs, useSubmitProgress } from '@/hooks/useProgress';
import { formatDateTime } from '@/lib/format';
import type { ProgressLog } from '@/types';

const schema = z.object({
  project_id: z.string().min(1, 'Select a project'),
  work_description: z.string().min(3, 'Describe the work completed'),
  progress_percent: z.coerce.number().min(0, 'Must be 0 or more').max(100, 'Must be 100 or less'),
  image_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export function ProgressPage() {
  const { data: projects = [] } = useProjects();
  const { data: logs = [], isLoading } = useProgressLogs();
  const submitProgress = useSubmitProgress();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { progress_percent: 0 } });

  const onSubmit = async (values: FormValues) => {
    await submitProgress.mutateAsync({
      project_id: values.project_id,
      work_description: values.work_description,
      progress_percent: values.progress_percent,
      image_url: values.image_url || undefined,
    });
    reset({ project_id: values.project_id, work_description: '', progress_percent: 0, image_url: '' });
  };

  const columns: Column<ProgressLog>[] = [
    { key: 'date', header: 'Date', render: (p) => formatDateTime(p.created_at) },
    { key: 'project', header: 'Project', render: (p) => p.project_name ?? '—' },
    { key: 'desc', header: 'Description', render: (p) => p.work_description },
    { key: 'pct', header: '%', render: (p) => `${p.progress_percent}%` },
  ];

  return (
    <div>
      <PageHeader title="Progress" description="Submit site progress updates and review history" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Submit progress</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <FormField label="Project" htmlFor="project_id" required error={errors.project_id?.message}>
                <Select id="project_id" defaultValue="" aria-invalid={!!errors.project_id} {...register('project_id')}>
                  <option value="" disabled>
                    Select a project
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Work description" htmlFor="work_description" required error={errors.work_description?.message}>
                <Textarea id="work_description" placeholder="e.g. Completed pier foundation casting for span 3" {...register('work_description')} />
              </FormField>

              <FormField label="Progress %" htmlFor="progress_percent" required error={errors.progress_percent?.message}>
                <Input id="progress_percent" type="number" min={0} max={100} {...register('progress_percent')} />
              </FormField>

              <FormField label="Image URL" htmlFor="image_url" hint="Optional site photo link" error={errors.image_url?.message}>
                <Input id="image_url" placeholder="https://…" {...register('image_url')} />
              </FormField>

              <Button type="submit" loading={submitProgress.isPending}>
                Submit progress
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTable columns={columns} data={logs} rowKey={(p) => p.id} isLoading={isLoading} emptyTitle="No progress submitted yet" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
