from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DbSession, require_roles
from app.models.enums import Role
from app.schemas.ra_bill import RABillCreate, RABillOut
from app.services import billing_service

router = APIRouter(prefix="/ra-bills", tags=["RA Bills"])


@router.get("", response_model=list[RABillOut])
async def list_bills(db: DbSession, current_user: CurrentUser, project_id: str | None = None) -> list[RABillOut]:
    return await billing_service.list_bills(db, project_id)


@router.post(
    "",
    response_model=RABillOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(Role.CONTRACTOR, Role.ADMIN))],
)
async def create_bill(payload: RABillCreate, db: DbSession, current_user: CurrentUser) -> RABillOut:
    return await billing_service.create_bill(db, payload, current_user)


@router.get("/{bill_id}", response_model=RABillOut)
async def get_bill(bill_id: str, db: DbSession, current_user: CurrentUser) -> RABillOut:
    return await billing_service.get_bill_out(db, bill_id)


@router.post(
    "/{bill_id}/submit",
    response_model=RABillOut,
    dependencies=[Depends(require_roles(Role.CONTRACTOR, Role.ADMIN))],
)
async def submit_bill(bill_id: str, db: DbSession, current_user: CurrentUser) -> RABillOut:
    return await billing_service.submit_bill(db, bill_id, current_user)
