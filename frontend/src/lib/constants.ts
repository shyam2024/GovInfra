import type { Role, WorkflowStage } from '@/types';

export const ROLES: Role[] = ['ADMIN', 'CONTRACTOR', 'ENGINEER', 'FINANCE', 'TREASURY'];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrator',
  CONTRACTOR: 'Contractor',
  ENGINEER: 'Engineer',
  FINANCE: 'Finance Officer',
  TREASURY: 'Treasury Officer',
};

export const WORKFLOW_STAGES: { key: WorkflowStage; label: string; accent: string }[] = [
  { key: 'SUBMITTED', label: 'Submitted', accent: 'bg-primary' },
  { key: 'ENGINEER_REVIEW', label: 'Engineer Review', accent: 'bg-accent' },
  { key: 'FINANCE_REVIEW', label: 'Finance Review', accent: 'bg-warning' },
  { key: 'TREASURY', label: 'Treasury', accent: 'bg-secondary' },
  { key: 'PAID', label: 'Paid', accent: 'bg-success' },
];

export const STAGE_LABELS = Object.fromEntries(WORKFLOW_STAGES.map((s) => [s.key, s.label])) as Record<WorkflowStage, string>;

/** Which role acts on which stage. ADMIN can act on any open stage. */
export const STAGE_OWNER: Partial<Record<WorkflowStage, Role>> = {
  ENGINEER_REVIEW: 'ENGINEER',
  FINANCE_REVIEW: 'FINANCE',
  TREASURY: 'TREASURY',
};

export const CHART_COLORS = ['#2563EB', '#0F766E', '#7C3AED', '#F59E0B', '#16A34A', '#DC2626', '#64748B'];

export const DEMO_USERS: { role: Role; email: string; password: string }[] = [
  { role: 'ADMIN', email: 'admin@demo.com', password: 'admin123' },
  { role: 'CONTRACTOR', email: 'contractor@demo.com', password: 'contractor123' },
  { role: 'ENGINEER', email: 'engineer@demo.com', password: 'engineer123' },
  { role: 'FINANCE', email: 'finance@demo.com', password: 'finance123' },
  { role: 'TREASURY', email: 'treasury@demo.com', password: 'treasury123' },
];
