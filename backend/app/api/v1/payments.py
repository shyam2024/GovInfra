from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, DbSession, require_roles
from app.models.enums import Role
from app.schemas.payment import PaymentOut
from app.services import payment_service

router = APIRouter(
    prefix="/payments",
    tags=["Treasury"],
    dependencies=[Depends(require_roles(Role.TREASURY, Role.ADMIN))],
)


@router.get("", response_model=list[PaymentOut])
async def list_payments(db: DbSession) -> list[PaymentOut]:
    return await payment_service.list_payments(db)


@router.post("/{payment_id}/release", response_model=PaymentOut)
async def release_payment(payment_id: str, db: DbSession, current_user: CurrentUser) -> PaymentOut:
    return await payment_service.release_payment(db, payment_id, current_user)
