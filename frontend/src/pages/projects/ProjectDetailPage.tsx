import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/tables/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressBar } from '@/components/ui/progress-bar';
import { MapCard } from '@/components/charts/map-card';
import { DataTable, type Column } from '@/components/tables/data-table';
import { useProject } from '@/hooks/useProjects';
import { useProgressLogs } from '@/hooks/useProgress';
import { useInspections } from '@/hooks/useInspections';
import { useWorkflowFiles } from '@/hooks/useWorkflow';
import { useBills } from '@/hooks/useBilling';
import { formatCompact, formatDate } from '@/lib/format';
import type { Inspection, ProgressLog, RABill, WorkflowFile } from '@/types';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);
  const [tab, setTab] = useState('overview');

  const { data: progress = [], isLoading: progressLoading } = useProgressLogs(id);
  const { data: inspections = [], isLoading: inspectionsLoading } = useInspections(id);
  const { data: files = [], isLoading: filesLoading } = useWorkflowFiles(id);
  const { data: bills = [], isLoading: billsLoading } = useBills(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-sm text-muted-foreground">Project not found.</p>;
  }

  const progressColumns: Column<ProgressLog>[] = [
    { key: 'date', header: 'Date', render: (p) => formatDate(p.created_at) },
    { key: 'desc', header: 'Work Description', render: (p) => p.work_description },
    { key: 'pct', header: 'Progress', render: (p) => `${p.progress_percent}%` },
    { key: 'by', header: 'Submitted By', render: (p) => p.submitted_by ?? '—' },
  ];

  const inspectionColumns: Column<Inspection>[] = [
    { key: 'date', header: 'Date', render: (i) => formatDate(i.inspection_date) },
    { key: 'status', header: 'Result', render: (i) => <StatusBadge status={i.status} /> },
    { key: 'remarks', header: 'Remarks', render: (i) => i.remarks },
    { key: 'inspector', header: 'Inspector', render: (i) => i.inspector_name ?? '—' },
  ];

  const fileColumns: Column<WorkflowFile>[] = [
    { key: 'file_number', header: 'File No.', render: (f) => f.file_number },
    { key: 'stage', header: 'Stage', render: (f) => <StatusBadge status={f.current_stage} /> },
    { key: 'holder', header: 'Current Holder', render: (f) => f.current_holder },
    { key: 'days', header: 'Days Pending', render: (f) => f.days_pending },
  ];

  const billColumns: Column<RABill>[] = [
    { key: 'bill_no', header: 'Bill No.', render: (b) => b.bill_no },
    { key: 'net', header: 'Net Amount', render: (b) => formatCompact(b.net_amount) },
    { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
    { key: 'date', header: 'Date', render: (b) => formatDate(b.created_at) },
  ];

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.location ?? undefined}
        actions={<StatusBadge status={project.status} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Budget" value={formatCompact(project.budget)} />
        <SummaryStat label="Spent" value={formatCompact(project.spent)} />
        <SummaryStat label="Contractor" value={project.contractor_name ?? '—'} />
        <SummaryStat label="Target Date" value={formatDate(project.end_date)} />
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-lg border border-border bg-card p-4">
        <span className="text-sm font-medium text-foreground">Overall progress</span>
        <ProgressBar value={project.progress_percent ?? 0} className="flex-1" />
        <span className="text-sm tabular-nums text-muted-foreground">{Math.round(project.progress_percent ?? 0)}%</span>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="inspection">Inspection</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="pt-4">
                <h3 className="mb-2 text-sm font-semibold text-foreground">Description</h3>
                <p className="text-sm text-muted-foreground">{project.description || 'No description provided.'}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Start date</dt>
                    <dd className="font-medium text-foreground">{formatDate(project.start_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Department</dt>
                    <dd className="font-medium text-foreground">{project.department ?? '—'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            <MapCard latitude={project.latitude} longitude={project.longitude} name={project.name} location={project.location} />
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <div className="rounded-lg border border-border bg-card">
            <DataTable columns={progressColumns} data={progress} rowKey={(p) => p.id} isLoading={progressLoading} emptyTitle="No progress submitted yet" />
          </div>
        </TabsContent>

        <TabsContent value="inspection">
          <div className="rounded-lg border border-border bg-card">
            <DataTable columns={inspectionColumns} data={inspections} rowKey={(i) => i.id} isLoading={inspectionsLoading} emptyTitle="No inspections recorded yet" />
          </div>
        </TabsContent>

        <TabsContent value="files">
          <div className="rounded-lg border border-border bg-card">
            <DataTable columns={fileColumns} data={files} rowKey={(f) => f.id} isLoading={filesLoading} emptyTitle="No workflow files yet" />
          </div>
        </TabsContent>

        <TabsContent value="bills">
          <div className="rounded-lg border border-border bg-card">
            <DataTable columns={billColumns} data={bills} rowKey={(b) => b.id} isLoading={billsLoading} emptyTitle="No RA bills yet" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground" title={value}>
        {value}
      </p>
    </div>
  );
}
