from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import (
    InspectionStatus,
    PaymentStatus,
    ProjectStatus,
    RABillStatus,
    Role,
    WorkflowStage,
)
from app.models.inspection import Inspection
from app.models.payment import Payment
from app.models.progress import ProgressLog
from app.models.project import Project
from app.models.ra_bill import RABill
from app.models.user import User
from app.models.workflow import WorkflowFile, WorkflowHistory
from app.schemas.common import ActivityItem, BudgetPoint, ChartPoint, MonthlyPaymentPoint
from app.schemas.dashboard import DashboardSummaryOut
from app.services.project_service import _spent_by_project
from app.services.workflow_service import _days_pending

PROJECT_STATUS_LABELS = {
    ProjectStatus.PLANNED: "Planned",
    ProjectStatus.ACTIVE: "Active",
    ProjectStatus.ON_HOLD: "On Hold",
    ProjectStatus.COMPLETED: "Completed",
    ProjectStatus.CANCELLED: "Cancelled",
}

STAGE_LABELS = {
    WorkflowStage.SUBMITTED: "Submitted",
    WorkflowStage.ENGINEER_REVIEW: "Engineer Review",
    WorkflowStage.FINANCE_REVIEW: "Finance Review",
    WorkflowStage.TREASURY: "Treasury",
    WorkflowStage.PAID: "Paid",
}


async def _scalar(db: AsyncSession, stmt) -> float:
    result = await db.execute(stmt)
    value = result.scalar_one_or_none()
    return float(value) if value is not None else 0.0


async def _admin_stats(db: AsyncSession) -> dict:
    total_projects = await _scalar(db, select(func.count()).select_from(Project))
    active_projects = await _scalar(db, select(func.count()).select_from(Project).where(Project.status == ProjectStatus.ACTIVE))
    pending_files = await _scalar(
        db, select(func.count()).select_from(WorkflowFile).where(WorkflowFile.current_stage != WorkflowStage.PAID)
    )
    released_payments = await _scalar(
        db, select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.status == PaymentStatus.RELEASED)
    )
    return {
        "total_projects": int(total_projects),
        "active_projects": int(active_projects),
        "pending_files": int(pending_files),
        "released_payments": released_payments,
    }


async def _contractor_stats(db: AsyncSession, user: User) -> dict:
    if not user.contractor_id:
        return {"my_projects": 0, "progress_submitted": 0, "pending_bills": 0, "paid_bills": 0}

    my_projects = await _scalar(db, select(func.count()).select_from(Project).where(Project.contractor_id == user.contractor_id))
    progress_submitted = await _scalar(
        db, select(func.count()).select_from(ProgressLog).where(ProgressLog.submitted_by_id == user.id)
    )
    pending_bills = await _scalar(
        db,
        select(func.count())
        .select_from(RABill)
        .where(RABill.contractor_id == user.contractor_id, RABill.status != RABillStatus.PAID),
    )
    paid_bills = await _scalar(
        db,
        select(func.count())
        .select_from(RABill)
        .where(RABill.contractor_id == user.contractor_id, RABill.status == RABillStatus.PAID),
    )
    return {
        "my_projects": int(my_projects),
        "progress_submitted": int(progress_submitted),
        "pending_bills": int(pending_bills),
        "paid_bills": int(paid_bills),
    }


async def _engineer_stats(db: AsyncSession, user: User) -> dict:
    active_no_inspection = await _scalar(
        db,
        select(func.count())
        .select_from(Project)
        .where(
            Project.status == ProjectStatus.ACTIVE,
            ~Project.id.in_(select(Inspection.project_id).distinct()),
        ),
    )
    files_awaiting_review = await _scalar(
        db, select(func.count()).select_from(WorkflowFile).where(WorkflowFile.current_stage == WorkflowStage.ENGINEER_REVIEW)
    )
    today = datetime.now(timezone.utc).date()
    todays_visits = await _scalar(
        db, select(func.count()).select_from(Inspection).where(Inspection.engineer_id == user.id, Inspection.inspection_date == today)
    )
    return {
        "pending_inspections": int(active_no_inspection),
        "files_awaiting_review": int(files_awaiting_review),
        "todays_visits": int(todays_visits),
    }


async def _finance_stats(db: AsyncSession) -> dict:
    bills_under_review = await _scalar(
        db, select(func.count()).select_from(WorkflowFile).where(WorkflowFile.current_stage == WorkflowStage.FINANCE_REVIEW)
    )
    returned_bills = await _scalar(db, select(func.count()).select_from(RABill).where(RABill.status == RABillStatus.RETURNED))

    result = await db.execute(select(WorkflowFile.created_at, WorkflowFile.stage_updated_at).where(WorkflowFile.current_stage != WorkflowStage.PAID))
    rows = result.all()
    if rows:
        avg_days = sum(_days_pending(created_at) for created_at, _ in rows) / len(rows)
    else:
        avg_days = 0.0
    return {
        "bills_under_review": int(bills_under_review),
        "returned_bills": int(returned_bills),
        "avg_processing_days": round(avg_days, 1),
    }


async def _treasury_stats(db: AsyncSession) -> dict:
    ready_for_payment = await _scalar(db, select(func.count()).select_from(Payment).where(Payment.status == PaymentStatus.READY))
    today = datetime.now(timezone.utc).date()
    released_today = await _scalar(
        db,
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.status == PaymentStatus.RELEASED, func.date(Payment.released_at) == today
        ),
    )
    total_released = await _scalar(
        db, select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.status == PaymentStatus.RELEASED)
    )
    return {
        "ready_for_payment": int(ready_for_payment),
        "released_today": released_today,
        "total_released": total_released,
    }


async def _project_status_chart(db: AsyncSession) -> list[ChartPoint]:
    result = await db.execute(select(Project.status, func.count()).group_by(Project.status))
    return [ChartPoint(name=PROJECT_STATUS_LABELS.get(status, status.value), value=count) for status, count in result.all()]


async def _workflow_status_chart(db: AsyncSession) -> list[ChartPoint]:
    result = await db.execute(select(WorkflowFile.current_stage, func.count()).group_by(WorkflowFile.current_stage))
    return [ChartPoint(name=STAGE_LABELS.get(stage, stage.value), value=count) for stage, count in result.all()]


async def _monthly_payments_chart(db: AsyncSession) -> list[MonthlyPaymentPoint]:
    now = datetime.now(timezone.utc)
    months: list[tuple[int, int]] = []
    cursor = date(now.year, now.month, 1)
    for _ in range(6):
        months.append((cursor.year, cursor.month))
        cursor = (cursor.replace(day=1) - timedelta(days=1)).replace(day=1)
    months.reverse()

    result = await db.execute(
        select(Payment.released_at, Payment.amount).where(
            Payment.status == PaymentStatus.RELEASED, Payment.released_at.is_not(None)
        )
    )
    rows = result.all()

    points: list[MonthlyPaymentPoint] = []
    for year, month in months:
        total = sum(float(amount) for released_at, amount in rows if released_at and released_at.year == year and released_at.month == month)
        label = date(year, month, 1).strftime("%b")
        points.append(MonthlyPaymentPoint(month=label, amount=total))
    return points


async def _budget_utilization_chart(db: AsyncSession) -> list[BudgetPoint]:
    result = await db.execute(select(Project).order_by(Project.budget.desc()).limit(8))
    projects = list(result.scalars().all())
    spent_map = await _spent_by_project(db, [p.id for p in projects])
    return [BudgetPoint(name=p.name, budget=float(p.budget), spent=spent_map.get(p.id, 0.0)) for p in projects]


async def _recent_activity(db: AsyncSession, limit: int = 8) -> list[ActivityItem]:
    result = await db.execute(select(WorkflowHistory).order_by(WorkflowHistory.timestamp.desc()).limit(limit))
    return [
        ActivityItem(
            id=str(h.id),
            officer=h.performed_by,
            department=h.department,
            action=h.action,
            remarks=h.remarks,
            timestamp=h.timestamp.isoformat(),
        )
        for h in result.scalars().all()
    ]


async def get_summary(db: AsyncSession, user: User) -> DashboardSummaryOut:
    data: dict = {}
    if user.role == Role.ADMIN:
        data.update(await _admin_stats(db))
        data["project_status"] = await _project_status_chart(db)
        data["workflow_status"] = await _workflow_status_chart(db)
        data["monthly_payments"] = await _monthly_payments_chart(db)
        data["budget_utilization"] = await _budget_utilization_chart(db)
    elif user.role == Role.CONTRACTOR:
        data.update(await _contractor_stats(db, user))
    elif user.role == Role.ENGINEER:
        data.update(await _engineer_stats(db, user))
    elif user.role == Role.FINANCE:
        data.update(await _finance_stats(db))
    elif user.role == Role.TREASURY:
        data.update(await _treasury_stats(db))

    data["recent_activity"] = await _recent_activity(db)
    return DashboardSummaryOut(**data)


async def get_analytics(db: AsyncSession) -> DashboardSummaryOut:
    return DashboardSummaryOut(
        project_status=await _project_status_chart(db),
        workflow_status=await _workflow_status_chart(db),
        monthly_payments=await _monthly_payments_chart(db),
        budget_utilization=await _budget_utilization_chart(db),
        recent_activity=await _recent_activity(db),
    )
