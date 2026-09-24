import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/components/layout/page-header';
import { ChartCard } from '@/components/charts/chart-card';
import { useAnalytics } from '@/hooks/useDashboard';
import { CHART_COLORS } from '@/lib/constants';
import { formatCompact, formatINR } from '@/lib/format';

export function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();

  const hasProjectStatus = (data?.project_status?.length ?? 0) > 0;
  const hasWorkflow = (data?.workflow_status?.length ?? 0) > 0;
  const hasPayments = (data?.monthly_payments?.length ?? 0) > 0;
  const hasBudget = (data?.budget_utilization?.length ?? 0) > 0;

  return (
    <div>
      <PageHeader title="Analytics" description="Portfolio-wide trends across projects, workflow, and payments" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Project Status" isLoading={isLoading} isEmpty={!hasProjectStatus}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data?.project_status} dataKey="value" nameKey="name" outerRadius={90} label={(d) => d.name}>
                {data?.project_status?.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Workflow Distribution" isLoading={isLoading} isEmpty={!hasWorkflow}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data?.workflow_status} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
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
      </div>
    </div>
  );
}
