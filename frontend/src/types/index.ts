export type Id = number | string;

export type Role = 'ADMIN' | 'CONTRACTOR' | 'ENGINEER' | 'FINANCE' | 'TREASURY';

export interface User {
  id: Id;
  email: string;
  full_name: string;
  role: Role;
  department?: string | null;
  is_active?: boolean;
}

export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface Project {
  id: Id;
  code?: string | null;
  name: string;
  description?: string | null;
  department?: string | null;
  status: ProjectStatus | string;
  budget: number;
  spent?: number | null;
  progress_percent?: number | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  contractor_id?: Id | null;
  contractor_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
}

export interface ProjectCreatePayload {
  name: string;
  description?: string;
  contractor_id?: Id;
  budget: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  start_date?: string;
  end_date?: string;
}

export interface Contractor {
  id: Id;
  name: string;
  registration_no?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface ProgressLog {
  id: Id;
  project_id: Id;
  project_name?: string | null;
  work_description: string;
  progress_percent: number;
  image_url?: string | null;
  submitted_by?: string | null;
  created_at: string;
}

export interface ProgressPayload {
  project_id: Id;
  work_description: string;
  progress_percent: number;
  image_url?: string;
}

export type InspectionStatus = 'PASS' | 'FAIL';

export interface Inspection {
  id: Id;
  project_id: Id;
  project_name?: string | null;
  status: InspectionStatus;
  remarks: string;
  image_url?: string | null;
  inspection_date: string;
  inspector_name?: string | null;
}

export interface InspectionPayload {
  project_id: Id;
  status: InspectionStatus;
  remarks: string;
  image_url?: string;
  inspection_date: string;
}

export type WorkflowStage = 'SUBMITTED' | 'ENGINEER_REVIEW' | 'FINANCE_REVIEW' | 'TREASURY' | 'PAID';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface WorkflowFile {
  id: Id;
  file_number: string;
  project_id: Id;
  project_name: string;
  bill_id?: Id | null;
  priority: Priority | string;
  current_stage: WorkflowStage;
  current_holder: string;
  days_pending: number;
  remarks?: string | null;
  created_at?: string;
}

export interface WorkflowHistory {
  id: Id;
  file_id: Id;
  officer: string;
  department: string;
  action: string;
  remarks?: string | null;
  timestamp: string;
}

export interface WorkflowActionPayload {
  remarks?: string;
}

export type RABillStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'RETURNED' | 'APPROVED' | 'PAID';

export interface RABill {
  id: Id;
  bill_no: string;
  project_id: Id;
  project_name?: string | null;
  contractor_name?: string | null;
  gross_amount: number;
  gst: number;
  retention: number;
  net_amount: number;
  status: RABillStatus | string;
  workflow_file_id?: Id | null;
  created_at?: string;
}

export interface RABillPayload {
  project_id: Id;
  gross_amount: number;
  gst: number;
  retention: number;
}

export type PaymentStatus = 'PENDING' | 'READY' | 'RELEASED';

export interface Payment {
  id: Id;
  bill_id: Id;
  bill_no: string;
  contractor_name: string;
  amount: number;
  status: PaymentStatus | string;
  released_at?: string | null;
}

export interface ChartPoint {
  name: string;
  value: number;
}

export interface BudgetPoint {
  name: string;
  budget: number;
  spent: number;
}

export interface MonthlyPaymentPoint {
  month: string;
  amount: number;
}

export interface ActivityItem {
  id: Id;
  officer: string;
  department?: string;
  action: string;
  remarks?: string | null;
  timestamp: string;
}

/** One shape for every role; the backend fills the fields relevant to the caller's role. */
export interface DashboardSummary {
  // Admin
  total_projects?: number;
  active_projects?: number;
  pending_files?: number;
  released_payments?: number;
  // Contractor
  my_projects?: number;
  progress_submitted?: number;
  pending_bills?: number;
  paid_bills?: number;
  // Engineer
  pending_inspections?: number;
  files_awaiting_review?: number;
  todays_visits?: number;
  // Finance
  bills_under_review?: number;
  returned_bills?: number;
  avg_processing_days?: number;
  // Treasury
  ready_for_payment?: number;
  released_today?: number;
  total_released?: number;
  // Charts
  project_status?: ChartPoint[];
  workflow_status?: ChartPoint[];
  monthly_payments?: MonthlyPaymentPoint[];
  budget_utilization?: BudgetPoint[];
  recent_activity?: ActivityItem[];
}

export type NotificationType = 'INFO' | 'ACTION' | 'WARNING' | 'SUCCESS';

export interface Notification {
  id: Id;
  title: string;
  message: string;
  is_read: boolean;
  type?: NotificationType | string;
  created_at: string;
}
