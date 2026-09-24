from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contractor import Contractor
from app.models.enums import NotificationType, PaymentStatus, RABillStatus, WorkflowStage
from app.models.payment import Payment
from app.models.ra_bill import RABill
from app.models.user import User
from app.models.workflow import WorkflowFile
from app.schemas.payment import PaymentOut
from app.services import notification_service


def _to_out(payment: Payment, bill_no: str, contractor_name: str) -> PaymentOut:
    return PaymentOut(
        id=str(payment.id),
        bill_id=str(payment.ra_bill_id),
        bill_no=bill_no,
        contractor_name=contractor_name,
        amount=float(payment.amount),
        status=payment.status,
        released_at=payment.released_at.isoformat() if payment.released_at else None,
    )


async def list_payments(db: AsyncSession) -> list[PaymentOut]:
    result = await db.execute(
        select(Payment, RABill.bill_number, Contractor.company_name)
        .join(RABill, Payment.ra_bill_id == RABill.id)
        .outerjoin(Contractor, RABill.contractor_id == Contractor.id)
        .order_by(Payment.created_at.desc())
    )
    return [_to_out(p, bill_no, contractor_name or "Unassigned") for p, bill_no, contractor_name in result.all()]


async def release_payment(db: AsyncSession, payment_id: str, current_user: User) -> PaymentOut:
    payment = await db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    if payment.status == PaymentStatus.RELEASED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This payment has already been released")

    payment.status = PaymentStatus.RELEASED
    payment.released_by = current_user.full_name
    payment.released_at = datetime.now(timezone.utc)

    bill = await db.get(RABill, payment.ra_bill_id)
    if bill:
        bill.status = RABillStatus.PAID

    if payment.workflow_file_id:
        wf = await db.get(WorkflowFile, payment.workflow_file_id)
        if wf and wf.current_stage != WorkflowStage.PAID:
            wf.current_stage = WorkflowStage.PAID
            wf.current_holder = "Completed"
            wf.current_department = "Completed"
            wf.stage_updated_at = datetime.now(timezone.utc)

    if bill and bill.contractor_id:
        result = await db.execute(select(User.id).where(User.contractor_id == bill.contractor_id))
        for (user_id,) in result.all():
            await notification_service.notify_user(
                db, user_id, "Payment released",
                f"Payment of ₹{float(payment.amount):,.2f} for bill {bill.bill_number} has been released.",
                NotificationType.SUCCESS,
            )

    await db.commit()
    await db.refresh(payment)

    contractor_name = "Unassigned"
    if bill and bill.contractor_id:
        contractor = await db.get(Contractor, bill.contractor_id)
        contractor_name = contractor.company_name if contractor else contractor_name
    return _to_out(payment, bill.bill_number if bill else "", contractor_name)
