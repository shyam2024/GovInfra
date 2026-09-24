import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { SearchBar } from '@/components/tables/search-bar';
import { DataTable, type Column } from '@/components/tables/data-table';
import { StatusBadge } from '@/components/tables/status-badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';
import { formatCompact, formatDate } from '@/lib/format';
import type { Project } from '@/types';

const STATUS_OPTIONS = ['All statuses', 'PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

export function ProjectListPage() {
  const { data: projects = [], isLoading } = useProjects();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesQuery = query.trim().length === 0 || p.name.toLowerCase().includes(query.toLowerCase()) || (p.code ?? '').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === 'All statuses' || p.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [projects, query, status]);

  const columns: Column<Project>[] = [
    { key: 'name', header: 'Project', render: (p) => (
        <div>
          <p className="font-medium text-foreground">{p.name}</p>
          {p.code && <p className="text-xs text-muted-foreground">{p.code}</p>}
        </div>
      ) },
    { key: 'contractor', header: 'Contractor', render: (p) => p.contractor_name ?? '—' },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'budget', header: 'Budget', render: (p) => formatCompact(p.budget) },
    { key: 'progress', header: 'Progress', className: 'min-w-[10rem]', render: (p) => (
        <div className="flex items-center gap-2">
          <ProgressBar value={p.progress_percent ?? 0} className="w-24" label={`${p.name} progress`} />
          <span className="text-xs text-muted-foreground">{Math.round(p.progress_percent ?? 0)}%</span>
        </div>
      ) },
    { key: 'end_date', header: 'Target Date', render: (p) => formatDate(p.end_date) },
  ];

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Government infrastructure projects across departments"
        actions={
          (user?.role === 'ADMIN') && (
            <Button onClick={() => navigate('/projects/new')}>
              <Plus /> New Project
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by name or code…" className="sm:w-72" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-48" aria-label="Filter by status">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'All statuses' ? s : s.replace('_', ' ')}
            </option>
          ))}
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(p) => p.id}
          isLoading={isLoading}
          emptyTitle="No projects found"
          emptyDescription="Try a different search or filter."
          onRowClick={(p) => navigate(`/projects/${p.id}`)}
        />
      </div>
    </div>
  );
}
