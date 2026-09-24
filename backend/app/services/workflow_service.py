"""The workflow engine — the heart of the backend.

Stage sequence: SUBMITTED -> ENGINEER_REVIEW -> FINANCE_REVIEW -> TREASURY -> PAID
(mirrors the frontend's WORKFLOW_STAGES/STAGE_OWNER constants exactly, see
src/lib/constants.ts). approve() advances one stage and, on reaching
TREASURY, creates a READY Payment so it shows up in the Treasury queue.
return_file() sends a file back to SUBMITTED for the contractor to revise.
Every transition appends an immutable WorkflowHistory row; only
WorkflowFile.current_stage is ever "current".
"""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import (
    STAGE_HOLDER_LABEL,
    STAGE_OWNER,
    WORKFLOW_SEQUENCE,
    NotificationType,
    PaymentStatus,
    Priority,
    RABillStatus,
    Role,
    WorkflowStage,
)
from app.models.payment import Payment
from app.models.project import Project
from app.models.ra_bill import RABill
from app.models.user import User
from app.models.workflow import WorkflowFile, WorkflowHistory
from app.schemas.workflow import WorkflowFileOut, WorkflowHistoryOut
from app.services import notification_service
from app.services.numbering import next_file_number, next_payment_reference


def _priority_for_amount(amount: float) -> Priority:
    if amount >= 20_000_000:
        return Priority.URGENT
    if amount >= 5_000_000:
        return Priority.HIGH
    if amount >= 1_000_000:
        return Priority.MEDIUM
    return Priority.LOW


def _days_pending(stage_updated_at: datetime) -> int:
    now = datetime.now(timezone.utc)
    ts = stage_updated_at if stage_updated_at.tzinfo else stage_updated_at.replace(tzinfo=timezone.utc)
    return max(0, (now - ts).days)


def _to_out(wf: WorkflowFile, project_name: str) -> WorkflowFileOut:
    return WorkflowFileOut(
        id=str(wf.id),
        file_number=wf.file_number,
        project_id=str(wf.project_id),
        project_name=project_name,
        bill_id=str(wf.ra_bill_id) if wf.ra_bill_id else None,
        priority=wf.priority,
        current_stage=wf.current_stage,
        current_holder=wf.current_holder,
        days_pending=_days_pending(wf.stage_updated_at),
        remarks=wf.remarks,
        created_at=wf.created_at.isoformat() if wf.created_at else None,
    )


def _history_to_out(h: WorkflowHistory) -> WorkflowHistoryOut:
    return WorkflowHistoryOut(
        id=str(h.id),
        file_id=str(h.workflow_file_id),
        officer=h.performed_by,
        department=h.department,
        action=h.action,
        remarks=h.remarks,
        timestamp=h.timestamp.isoformat(),
    )


async def list_files(db: AsyncSession, project_id: str | None) -> list[WorkflowFileOut]:
    query = select(WorkflowFile, Project.name).join(Project, WorkflowFile.project_id == Project.id)
    if project_id:
        query = query.where(WorkflowFile.project_id == project_id)
    query = query.order_by(WorkflowFile.created_at.desc())
    result = await db.execute(query)
    return [_to_out(wf, project_name) for wf, project_name in result.all()]


async def get_file(db: AsyncSession, file_id: str) -> WorkflowFile:
    wf = await db.get(WorkflowFile, file_id)
    if not wf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow file not found")
    return wf


async def get_history(db: AsyncSession, file_id: str) -> list[WorkflowHistoryOut]:
    await get_file(db, file_id)  # 404 if missing
    result = await db.execute(
        select(WorkflowHistory).where(WorkflowHistory.workflow_file_id == file_id).order_by(WorkflowHistory.timestamp.desc())
    )
    return [_history_to_out(h) for h in result.scalars().all()]


async def create_file(db: AsyncSession, *, project_id: uuid.UUID, ra_bill: RABill, current_user: User) -> WorkflowFile:
    """Called from billing_service when a contractor submits an RA bill."""
    wf = WorkflowFile(
        file_number=await next_file_number(db),
        project_id=project_id,
        ra_bill_id=ra_bill.id,
        current_stage=WorkflowStage.SUBMITTED,
        current_holder=STAGE_HOLDER_LABEL[WorkflowStage.SUBMITTED],
        current_department=STAGE_HOLDER_LABEL[WorkflowStage.SUBMITTED],
        priority=_priority_for_amount(float(ra_bill.net_amount)),
        stage_updated_at=datetime.now(timezone.utc),
    )
    db.add(wf)
    await db.flush()

    db.add(
        WorkflowHistory(
            workflow_file_id=wf.id,
            performed_by=current_user.full_name,
            department=current_user.department or current_user.role.value.title(),
            action="File Submitted",
            from_state=None,
            to_state=WorkflowStage.SUBMITTED.value,
            remarks=f"RA bill {ra_bill.bill_number} submitted for review.",
        )
    )
    await notification_service.notify_role(
        db, Role.ENGINEER, "New file for review", f"File {wf.file_number} is awaiting engineer review.", NotificationType.ACTION
    )
    return wf


def _assert_can_act(current_user: User, stage: WorkflowStage) -> None:
    owner = STAGE_OWNER.get(stage)
    allowed = current_user.role == Role.ADMIN or (owner is not None and current_user.role == owner)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only {'an administrator' if owner is None else owner.value.title()} can act on a file at the {stage.value} stage.",
        )


async def _notify_bill_stakeholders(db: AsyncSession, ra_bill: RABill | None, title: str, message: str, ntype: NotificationType) -> None:
    if not ra_bill or not ra_bill.contractor_id:
        return
    result = await db.execute(select(User.id).where(User.contractor_id == ra_bill.contractor_id))
    for (user_id,) in result.all():
        await notification_service.notify_user(db, user_id, title, message, ntype)


async def approve(db: AsyncSession, file_id: str, current_user: User, remarks: str | None) -> WorkflowFileOut:
    wf = await get_file(db, file_id)
    if wf.current_stage == WorkflowStage.PAID:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This file has already reached Paid — nothing left to approve.")

    _assert_can_act(current_user, wf.current_stage)

    idx = WORKFLOW_SEQUENCE.index(wf.current_stage)
    next_stage = WORKFLOW_SEQUENCE[idx + 1]
    from_stage = wf.current_stage

    ra_bill = await db.get(RABill, wf.ra_bill_id) if wf.ra_bill_id else None

    wf.current_stage = next_stage
    wf.current_holder = STAGE_HOLDER_LABEL[next_stage]
    wf.current_department = STAGE_HOLDER_LABEL[next_stage]
    wf.stage_updated_at = datetime.now(timezone.utc)
    if remarks:
        wf.remarks = remarks

    db.add(
        WorkflowHistory(
            workflow_file_id=wf.id,
            performed_by=current_user.full_name,
            department=current_user.department or current_user.role.value.title(),
            action=f"Approved — forwarded to {STAGE_HOLDER_LABEL[next_stage]}",
            from_state=from_stage.value,
            to_state=next_stage.value,
            remarks=remarks,
        )
    )

    if ra_bill:
        if next_stage in (WorkflowStage.FINANCE_REVIEW, WorkflowStage.TREASURY):
            ra_bill.status = RABillStatus.UNDER_REVIEW
        elif next_stage == WorkflowStage.PAID:
            ra_bill.status = RABillStatus.APPROVED

    # Reaching TREASURY means the bill is cleared for payment — queue it.
    if next_stage == WorkflowStage.TREASURY and ra_bill:
        db.add(
            Payment(
                payment_reference=await next_payment_reference(db),
                ra_bill_id=ra_bill.id,
                workflow_file_id=wf.id,
                amount=ra_bill.net_amount,
                status=PaymentStatus.READY,
            )
        )
        await notification_service.notify_role(
            db, Role.TREASURY, "Payment ready for release", f"File {wf.file_number} is ready for payment release.", NotificationType.ACTION
        )

    # Approving at TREASURY *is* the release: pay out immediately.
    if next_stage == WorkflowStage.PAID and ra_bill:
        result = await db.execute(
            select(Payment).where(Payment.ra_bill_id == ra_bill.id, Payment.status != PaymentStatus.RELEASED)
        )
        payment = result.scalars().first()
        if not payment:
            payment = Payment(
                payment_reference=await next_payment_reference(db),
                ra_bill_id=ra_bill.id,
                workflow_file_id=wf.id,
                amount=ra_bill.net_amount,
                status=PaymentStatus.READY,
            )
            db.add(payment)
            await db.flush()
        payment.status = PaymentStatus.RELEASED
        payment.released_by = current_user.full_name
        payment.released_at = datetime.now(timezone.utc)
        ra_bill.status = RABillStatus.PAID
        await _notify_bill_stakeholders(
            db, ra_bill, "Payment released", f"Payment for bill {ra_bill.bill_number} has been released.", NotificationType.SUCCESS
        )

    await db.commit()
    await db.refresh(wf)
    project = await db.get(Project, wf.project_id)
    return _to_out(wf, project.name if project else "")


async def return_file(db: AsyncSession, file_id: str, current_user: User, remarks: str) -> WorkflowFileOut:
    wf = await get_file(db, file_id)
    if wf.current_stage in (WorkflowStage.SUBMITTED, WorkflowStage.PAID):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"A file at {wf.current_stage.value} cannot be returned.")

    _assert_can_act(current_user, wf.current_stage)

    from_stage = wf.current_stage
    ra_bill = await db.get(RABill, wf.ra_bill_id) if wf.ra_bill_id else None

    wf.current_stage = WorkflowStage.SUBMITTED
    wf.current_holder = STAGE_HOLDER_LABEL[WorkflowStage.SUBMITTED]
    wf.current_department = STAGE_HOLDER_LABEL[WorkflowStage.SUBMITTED]
    wf.stage_updated_at = datetime.now(timezone.utc)
    wf.remarks = remarks

    db.add(
        WorkflowHistory(
            workflow_file_id=wf.id,
            performed_by=current_user.full_name,
            department=current_user.department or current_user.role.value.title(),
            action="Returned for revision",
            from_state=from_stage.value,
            to_state=WorkflowStage.SUBMITTED.value,
            remarks=remarks,
        )
    )

    if ra_bill:
        ra_bill.status = RABillStatus.RETURNED
        await _notify_bill_stakeholders(
            db, ra_bill, "Bill returned", f"Bill {ra_bill.bill_number} was returned: {remarks}", NotificationType.WARNING
        )

    await db.commit()
    await db.refresh(wf)
    project = await db.get(Project, wf.project_id)
    return _to_out(wf, project.name if project else "")
