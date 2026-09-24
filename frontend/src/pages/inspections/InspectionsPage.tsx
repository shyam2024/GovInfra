import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/tables/data-table';
import { StatusBadge } from '@/components/tables/status-badge';
import { useProjects } from '@/hooks/useProjects';
import { useCreateInspection, useInspections } from '@/hooks/useInspections';
import { formatDate, todayISO } from '@/lib/format';
import type { Inspection } from '@/types';

const schema = z.object({
  project_id: z.string().min(1, 'Select a project'),
  status: z.enum(['PASS', 'FAIL']),
  remarks: z.string().min(3, 'Add inspection remarks'),
  image_url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  inspection_date: z.string().min(1, 'Select a date'),
});
type FormValues = z.infer<typeof schema>;

export function InspectionsPage() {
  const { data: projects = [] } = useProjects();
  const { data: inspections = [], isLoading } = useInspections();
  const createInspection = useCreateInspection();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { status: 'PASS', inspection_date: todayISO() } });

  const onSubmit = async (values: FormValues) => {
    await createInspection.mutateAsync({
      project_id: values.project_id,
      status: values.status,
      remarks: values.remarks,
      image_url: values.image_url || undefined,
      inspection_date: values.inspection_date,
    });
    reset({ project_id: values.project_id, status: 'PASS', remarks: '', image_url: '', inspection_date: todayISO() });
  };

  const columns: Column<Inspection>[] = [
    { key: 'date', header: 'Date', render: (i) => formatDate(i.inspection_date) },
    { key: 'project', header: 'Project', render: (i) => i.project_name ?? '—' },
    { key: 'status', header: 'Result', render: (i) => <StatusBadge status={i.status} /> },
    { key: 'remarks', header: 'Remarks', render: (i) => i.remarks },
  ];

  return (
    <div>
      <PageHeader title="Inspections" description="Record site inspections and review pass/fail history" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>New inspection</CardTitle>
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

              <FormField label="Result" htmlFor="status" required>
                <Select id="status" {...register('status')}>
                  <option value="PASS">Pass</option>
                  <option value="FAIL">Fail</option>
                </Select>
              </FormField>

              <FormField label="Inspection date" htmlFor="inspection_date" required error={errors.inspection_date?.message}>
                <Input id="inspection_date" type="date" {...register('inspection_date')} />
              </FormField>

              <FormField label="Remarks" htmlFor="remarks" required error={errors.remarks?.message}>
                <Textarea id="remarks" placeholder="Observations, defects, compliance notes…" {...register('remarks')} />
              </FormField>

              <FormField label="Image URL" htmlFor="image_url" hint="Optional site photo link" error={errors.image_url?.message}>
                <Input id="image_url" placeholder="https://…" {...register('image_url')} />
              </FormField>

              <Button type="submit" loading={createInspection.isPending}>
                Record inspection
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inspection history</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTable columns={columns} data={inspections} rowKey={(i) => i.id} isLoading={isLoading} emptyTitle="No inspections recorded yet" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
