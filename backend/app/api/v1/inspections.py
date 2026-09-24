from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DbSession, require_roles
from app.models.enums import Role
from app.schemas.inspection import InspectionCreate, InspectionOut, InspectionUpdate
from app.services import inspection_service

router = APIRouter(prefix="/inspections", tags=["Inspections"])


@router.get("", response_model=list[InspectionOut])
async def list_inspections(db: DbSession, current_user: CurrentUser, project_id: str | None = None) -> list[InspectionOut]:
    return await inspection_service.list_inspections(db, project_id)


@router.post(
    "",
    response_model=InspectionOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(Role.ENGINEER, Role.ADMIN))],
)
async def create_inspection(payload: InspectionCreate, db: DbSession, current_user: CurrentUser) -> InspectionOut:
    return await inspection_service.create_inspection(db, payload, current_user)


@router.put(
    "/{inspection_id}",
    response_model=InspectionOut,
    dependencies=[Depends(require_roles(Role.ENGINEER, Role.ADMIN))],
)
async def update_inspection(inspection_id: str, payload: InspectionUpdate, db: DbSession) -> InspectionOut:
    return await inspection_service.update_inspection(db, inspection_id, payload)
