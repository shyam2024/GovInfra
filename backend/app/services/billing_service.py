from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contractor import Contractor
from app.models.enums import NotificationType, RABillStatus, Role
from app.models.project import Project
from app.models.ra_bill import RABill
from app.models.user import User
from app.schemas.ra_bill import RABillCreate, RABillOut
from app.services import notification_service, workflow_service
from app.services.numbering import next_bill_number


def _to_out(bill: RABill, project_name: str | None, contractor_name: str | None) -> RABillOut:
    return RABillOut(
        id=str(bill.id),
        bill_no=bill.bill_number,
        project_id=str(bill.project_id),
        project_name=project_name,
        contractor_name=contractor_name,
        gross_amount=float(bill.gross_amount),
        gst=float(bill.gst),
        retention=float(bill.retention),
        net_amount=float(bill.net_amount),
        status=bill.status,
        workflow_file_id=str(bill.workflow_file_id) if bill.workflow_file_id else None,
        created_at=bill.created_at.isoformat() if bill.created_at else None,
    )


async def list_bills(db: AsyncSession, project_id: str | None) -> list[RABillOut]:
    query = (
        select(RABill, Project.name, Contractor.company_name)
        .join(Project, RABill.project_id == Project.id)
        .outerjoin(Contractor, RABill.contractor_id == Contractor.id)
        .order_by(RABill.created_at.desc())
    )
    if project_id:
        query = query.where(RABill.project_id == project_id)
    result = await db.execute(query)
    return [_to_out(b, project_name, contractor_name) for b, project_name, contractor_name in result.all()]


async def get_bill(db: AsyncSession, bill_id: str) -> RABill:
    bill = await db.get(RABill, bill_id)
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RA bill not found")
    return bill


async def get_bill_out(db: AsyncSession, bill_id: str) -> RABillOut:
    bill = await get_bill(db, bill_id)
    project = await db.get(Project, bill.project_id)
    contractor = await db.get(Contractor, bill.contractor_id) if bill.contractor_id else None
    return _to_out(bill, project.name if project else None, contractor.company_name if contractor else None)


async def create_bill(db: AsyncSession, payload: RABillCreate, current_user: User) -> RABillOut:
    project = await db.get(Project, payload.project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project not found")

    contractor_id = current_user.contractor_id or project.contractor_id
    net_amount = float(payload.gross_amount) + float(payload.gst) - float(payload.retention)
    if net_amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Net amount must be greater than zero")

    bill = RABill(
        bill_number=await next_bill_number(db),
        project_id=payload.project_id,
        contractor_id=contractor_id,
        gross_amount=payload.gross_amount,
        gst=payload.gst,
        retention=payload.retention,
        net_amount=net_amount,
        status=RABillStatus.DRAFT,
    )
    db.add(bill)
    await db.commit()
    await db.refresh(bill)
    return await get_bill_out(db, str(bill.id))


async def submit_bill(db: AsyncSession, bill_id: str, current_user: User) -> RABillOut:
    bill = await get_bill(db, bill_id)
    if bill.status != RABillStatus.DRAFT:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only a draft bill can be submitted")

    bill.status = RABillStatus.SUBMITTED
    wf = await workflow_service.create_file(db, project_id=bill.project_id, ra_bill=bill, current_user=current_user)
    bill.workflow_file_id = wf.id

    await notification_service.notify_role(
        db, Role.ADMIN, "RA bill submitted", f"Bill {bill.bill_number} was submitted and is now in the workflow.", NotificationType.INFO
    )

    await db.commit()
    return await get_bill_out(db, str(bill.id))
