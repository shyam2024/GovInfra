import { useAuth } from '@/contexts/AuthContext';
import { useDashboardSummary } from '@/hooks/useDashboard';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/charts/stat-card';
import { ChartCard } from '@/components/charts/chart-card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_COLORS, ROLE_LABELS } from '@/lib/constants';
import { formatCompact, formatDateTime, formatINR } from '@/lib/format';
import {
  Banknote,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileClock,
  FileSearch,
  FolderKanban,
  Landmark,
  ReceiptText,
  RotateCcw,
  Timer,
  Wallet,
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardSummary();
  if (!user) return null;

  return (
    <div>
      <PageHeader title={`Welcome back, ${user.full_name.split(' ')[0]}`} description={`${ROLE_LABELS[user.role]} dashboard`} />

      {user.role === 'ADMIN' && <AdminCards data={data} isLoading={isLoading} />}
      {user.role === 'CONTRACTOR' && <ContractorCards data={data} isLoading={isLoading} />}
      {user.role === 'ENGINEER' && <EngineerCards data={data} isLoading={isLoading} />}
      {user.role === 'FINANCE' && <FinanceCards data={data} isLoading={isLoading} />}
      {user.role === 'TREASURY' && <TreasuryCards data={data} isLoading={isLoading} />}

      {user.role === 'ADMIN' && <AdminCharts data={data} isLoading={isLoading} />}

      {(data?.recent_activity?.length ?? 0) > 0 && (
        <div className="mt-6">
          <ChartCard title="Recent Activity" isLoading={isLoading}>
            <div className="h-full space-y-3 overflow-y-auto pr-1">
              {data!.recent_activity!.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 border-b border-border pb-2.5 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">
                      <span className="font-medium">{a.officer}</span> {a.action}
                    </p>
                    {a.remarks && <p className="truncate text-xs text-muted-foreground">{a.remarks}</p>}
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">{formatDateTime(a.timestamp)}</time>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
}

type Props = { data?: import('@/types').DashboardSummary; isLoading: boolean };

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

function AdminCards({ data, isLoading }: Props) {
  return (
    <CardGrid>
      <StatCard label="Total Projects" value={data?.total_projects ?? 0} icon={FolderKanban} tone="primary" isLoading={isLoading} />
      <StatCard label="Active Projects" value={data?.active_projects ?? 0} icon={CheckCircle2} tone="success" isLoading={isLoading} />
      <StatCard label="Pending Files" value={data?.pending_files ?? 0} icon={FileClock} tone="warning" isLoading={isLoading} />
      <StatCard label="Released Payments" value={formatCompact(data?.released_payments)} icon={Banknote} tone="secondary" isLoading={isLoading} />
    </CardGrid>
  );
}

function ContractorCards({ data, isLoading }: Props) {
  return (
    <CardGrid>
      <StatCard label="My Projects" value={data?.my_projects ?? 0} icon={FolderKanban} tone="primary" isLoading={isLoading} />
      <StatCard label="Progress Submitted" value={data?.progress_submitted ?? 0} icon={ClipboardList} tone="secondary" isLoading={isLoading} />
      <StatCard label="Pending Bills" value={data?.pending_bills ?? 0} icon={FileClock} tone="warning" isLoading={isLoading} />
      <StatCard label="Paid Bills" value={data?.paid_bills ?? 0} icon={Wallet} tone="success" isLoading={isLoading} />
    </CardGrid>
  );
}

function EngineerCards({ data, isLoading }: Props) {
  return (
    <CardGrid>
      <StatCard label="Pending Inspections" value={data?.pending_inspections ?? 0} icon={ClipboardCheck} tone="primary" isLoading={isLoading} />
      <StatCard label="Files Awaiting Review" value={data?.files_awaiting_review ?? 0} icon={FileSearch} tone="accent" isLoading={isLoading} />
      <StatCard label="Today's Visits" value={data?.todays_visits ?? 0} icon={CalendarCheck} tone="secondary" isLoading={isLoading} />
    </CardGrid>
  );
}

function FinanceCards({ data, isLoading }: Props) {
  return (
    <CardGrid>
      <StatCard label="Bills Under Review" value={data?.bills_under_review ?? 0} icon={ReceiptText} tone="primary" isLoading={isLoading} />
      <StatCard label="Returned Bills" value={data?.returned_bills ?? 0} icon={RotateCcw} tone="danger" isLoading={isLoading} />
      <StatCard label="Processing Time" value={data?.avg_processing_days != null ? `${data.avg_processing_days}d` : '—'} icon={Timer} tone="warning" isLoading={isLoading} />
    </CardGrid>
  );
}

function TreasuryCards({ data, isLoading }: Props) {
  return (
    <CardGrid>
      <StatCard label="Ready for Payment" value={data?.ready_for_payment ?? 0} icon={Landmark} tone="primary" isLoading={isLoading} />
      <StatCard label="Released Today" value={formatINR(data?.released_today)} icon={CheckCircle2} tone="success" isLoading={isLoading} />
      <StatCard label="Total Released" value={formatCompact(data?.total_released)} icon={Banknote} tone="secondary" isLoading={isLoading} />
    </CardGrid>
  );
}

function AdminCharts({ data, isLoading }: Props) {
  const hasProjectStatus = (data?.project_status?.length ?? 0) > 0;
  const hasWorkflow = (data?.workflow_status?.length ?? 0) > 0;
  const hasPayments = (data?.monthly_payments?.length ?? 0) > 0;
  const hasBudget = (data?.budget_utilization?.length ?? 0) > 0;

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Budget Utilization" isLoading={isLoading} isEmpty={!hasBudget}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.budget_utilization} margin={{ left: -12, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompact(v)} />
            <Tooltip formatter={(v) => formatINR(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="budget" name="Budget" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            <Bar dataKey="spent" name="Spent" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Workflow Status" isLoading={isLoading} isEmpty={!hasWorkflow}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data?.workflow_status} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
              {data?.workflow_status?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly Payments" isLoading={isLoading} isEmpty={!hasPayments}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data?.monthly_payments} margin={{ left: -12, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCompact(v)} />
            <Tooltip formatter={(v) => formatINR(Number(v))} />
            <Line type="monotone" dataKey="amount" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Project Status" isLoading={isLoading} isEmpty={!hasProjectStatus}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data?.project_status} dataKey="value" nameKey="name" outerRadius={85} label={(d) => d.name}>
              {data?.project_status?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
