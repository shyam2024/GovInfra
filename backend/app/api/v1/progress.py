from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DbSession, require_roles
from app.models.enums import Role
from app.schemas.progress import ProgressCreate, ProgressLogOut
from app.services import progress_service

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.get("", response_model=list[ProgressLogOut])
async def list_progress(db: DbSession, current_user: CurrentUser, project_id: str | None = None) -> list[ProgressLogOut]:
    return await progress_service.list_progress(db, project_id)


@router.post(
    "",
    response_model=ProgressLogOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(Role.CONTRACTOR, Role.ADMIN))],
)
async def create_progress(payload: ProgressCreate, db: DbSession, current_user: CurrentUser) -> ProgressLogOut:
    return await progress_service.create_progress(db, payload, current_user)
