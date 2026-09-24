import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/tables/data-table';
import { StatusBadge } from '@/components/tables/status-badge';
import { useProjects } from '@/hooks/useProjects';
import { useBills, useCreateBill, useSubmitBill } from '@/hooks/useBilling';
import { formatDate, formatINRPrecise } from '@/lib/format';
import { getErrorMessage } from '@/services/api';
import type { RABill } from '@/types';

const schema = z.object({
  project_id: z.string().min(1, 'Select a project'),
  gross_amount: z.coerce.number().positive('Enter a gross amount greater than zero'),
  gst: z.coerce.number().min(0, 'GST cannot be negative'),
  retention: z.coerce.number().min(0, 'Retention cannot be negative'),
});
type FormValues = z.infer<typeof schema>;

export function BillingPage() {
  const { data: projects = [] } = useProjects();
  const { data: bills = [], isLoading } = useBills();
  const createBill = useCreateBill();
  const submitBill = useSubmitBill();
  const [pendingSubmitId, setPendingSubmitId] = useState<string | number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { gross_amount: 0, gst: 0, retention: 0 } });

  const [gross, gst, retention] = watch(['gross_amount', 'gst', 'retention']);
  const netAmount = useMemo(() => {
    const g = Number(gross) || 0;
    const t = Number(gst) || 0;
    const r = Number(retention) || 0;
    return g + t - r;
  }, [gross, gst, retention]);

  const onSaveDraft = handleSubmit(async (values) => {
    await createBill.mutateAsync(values);
    reset({ project_id: values.project_id, gross_amount: 0, gst: 0, retention: 0 });
  });

  const handleSubmitBill = async (id: string | number) => {
    setPendingSubmitId(id);
    try {
      await submitBill.mutateAsync(id);
      toast.success('Bill submitted for engineer review');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPendingSubmitId(null);
    }
  };

  const columns: Column<RABill>[] = [
    { key: 'bill_no', header: 'Bill No.', render: (b) => <span className="font-medium text-foreground">{b.bill_no}</span> },
    { key: 'project', header: 'Project', render: (b) => b.project_name ?? '—' },
    { key: 'gross', header: 'Gross', render: (b) => formatINRPrecise(b.gross_amount) },
    { key: 'net', header: 'Net Amount', render: (b) => <span className="font-medium">{formatINRPrecise(b.net_amount)}</span> },
    { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
    { key: 'date', header: 'Date', render: (b) => formatDate(b.created_at) },
    {
      key: 'actions',
      header: '',
      render: (b) =>
        b.status === 'DRAFT' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleSubmitBill(b.id);
            }}
            loading={pendingSubmitId === b.id}
          >
            <Send /> Submit
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title="RA Bills" description="Create running-account bills and track their approval status" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Create bill</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={onSaveDraft} className="flex flex-col gap-4" noValidate>
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

              <FormField label="Gross amount (INR)" htmlFor="gross_amount" required error={errors.gross_amount?.message}>
                <Input id="gross_amount" type="number" min={0} step="0.01" {...register('gross_amount')} />
              </FormField>

              <FormField label="GST (INR)" htmlFor="gst" required error={errors.gst?.message}>
                <Input id="gst" type="number" min={0} step="0.01" {...register('gst')} />
              </FormField>

              <FormField label="Retention (INR)" htmlFor="retention" required error={errors.retention?.message}>
                <Input id="retention" type="number" min={0} step="0.01" {...register('retention')} />
              </FormField>

              <div className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2.5">
                <span className="text-sm font-medium text-foreground">Net amount</span>
                <span className="text-base font-semibold tabular-nums text-foreground">{formatINRPrecise(netAmount)}</span>
              </div>

              <Button type="submit" loading={createBill.isPending}>
                Save draft
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>All bills</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTable columns={columns} data={bills} rowKey={(b) => b.id} isLoading={isLoading} emptyTitle="No RA bills yet" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
