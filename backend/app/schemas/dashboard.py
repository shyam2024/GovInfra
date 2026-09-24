from pydantic import BaseModel

from app.schemas.common import ActivityItem, BudgetPoint, ChartPoint, MonthlyPaymentPoint


class DashboardSummaryOut(BaseModel):
    # Admin
    total_projects: int | None = None
    active_projects: int | None = None
    pending_files: int | None = None
    released_payments: float | None = None
    # Contractor
    my_projects: int | None = None
    progress_submitted: int | None = None
    pending_bills: int | None = None
    paid_bills: int | None = None
    # Engineer
    pending_inspections: int | None = None
    files_awaiting_review: int | None = None
    todays_visits: int | None = None
    # Finance
    bills_under_review: int | None = None
    returned_bills: int | None = None
    avg_processing_days: float | None = None
    # Treasury
    ready_for_payment: int | None = None
    released_today: float | None = None
    total_released: float | None = None
    # Charts (admin dashboard + analytics page)
    project_status: list[ChartPoint] | None = None
    workflow_status: list[ChartPoint] | None = None
    monthly_payments: list[MonthlyPaymentPoint] | None = None
    budget_utilization: list[BudgetPoint] | None = None
    recent_activity: list[ActivityItem] | None = None
