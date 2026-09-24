import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useContractors, useCreateProject } from '@/hooks/useProjects';

const schema = z.object({
  name: z.string().min(3, 'Enter a project name'),
  description: z.string().optional(),
  contractor_id: z.string().optional(),
  budget: z.coerce.number().positive('Enter a budget greater than zero'),
  location: z.string().optional(),
  latitude: z.union([z.coerce.number(), z.nan()]).optional(),
  longitude: z.union([z.coerce.number(), z.nan()]).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CreateProjectPage() {
  const navigate = useNavigate();
  const { data: contractors = [] } = useContractors();
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    const project = await createProject.mutateAsync({
      name: values.name,
      description: values.description || undefined,
      contractor_id: values.contractor_id || undefined,
      budget: values.budget,
      location: values.location || undefined,
      latitude: Number.isNaN(values.latitude) ? undefined : values.latitude,
      longitude: Number.isNaN(values.longitude) ? undefined : values.longitude,
      start_date: values.start_date || undefined,
      end_date: values.end_date || undefined,
    });
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="New Project" description="Register a new infrastructure project" />
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <FormField label="Project name" htmlFor="name" required error={errors.name?.message}>
              <Input id="name" placeholder="e.g. Narmada Canal Bridge — Package 4" aria-invalid={!!errors.name} {...register('name')} />
            </FormField>

            <FormField label="Description" htmlFor="description" error={errors.description?.message}>
              <Textarea id="description" placeholder="Scope of work, key deliverables…" {...register('description')} />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Contractor" htmlFor="contractor_id" error={errors.contractor_id?.message}>
                <Select id="contractor_id" defaultValue="" {...register('contractor_id')}>
                  <option value="">Unassigned</option>
                  {contractors.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Budget (INR)" htmlFor="budget" required error={errors.budget?.message}>
                <Input id="budget" type="number" min={0} step="0.01" placeholder="e.g. 45000000" aria-invalid={!!errors.budget} {...register('budget')} />
              </FormField>
            </div>

            <FormField label="Location" htmlFor="location" hint="Village/town and district" error={errors.location?.message}>
              <Input id="location" placeholder="e.g. Bharuch, Gujarat" {...register('location')} />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Latitude" htmlFor="latitude" hint="Optional — shows on the site map" error={errors.latitude?.message}>
                <Input id="latitude" type="number" step="any" placeholder="21.7051" {...register('latitude')} />
              </FormField>
              <FormField label="Longitude" htmlFor="longitude" hint="Optional — shows on the site map" error={errors.longitude?.message}>
                <Input id="longitude" type="number" step="any" placeholder="72.9959" {...register('longitude')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Start date" htmlFor="start_date" error={errors.start_date?.message}>
                <Input id="start_date" type="date" {...register('start_date')} />
              </FormField>
              <FormField label="Target end date" htmlFor="end_date" error={errors.end_date?.message}>
                <Input id="end_date" type="date" {...register('end_date')} />
              </FormField>
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/projects')}>
                Cancel
              </Button>
              <Button type="submit" loading={createProject.isPending}>
                Create project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
