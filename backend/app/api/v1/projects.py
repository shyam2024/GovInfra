from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DbSession, require_roles
from app.models.enums import ProjectStatus, Role
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=list[ProjectOut])
async def list_projects(
    db: DbSession,
    current_user: CurrentUser,
    search: str | None = None,
    department: str | None = None,
    status_filter: ProjectStatus | None = None,
) -> list[ProjectOut]:
    return await project_service.list_projects(db, search=search, status_filter=status_filter, department=department)


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate, db: DbSession, current_user=Depends(require_roles(Role.ADMIN))) -> ProjectOut:
    return await project_service.create_project(db, payload, created_by=current_user.id)


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str, db: DbSession, current_user: CurrentUser) -> ProjectOut:
    return await project_service.get_project(db, project_id)


@router.put("/{project_id}", response_model=ProjectOut, dependencies=[Depends(require_roles(Role.ADMIN))])
async def update_project(project_id: str, payload: ProjectUpdate, db: DbSession) -> ProjectOut:
    return await project_service.update_project(db, project_id, payload)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_roles(Role.ADMIN))])
async def delete_project(project_id: str, db: DbSession) -> None:
    await project_service.delete_project(db, project_id)
