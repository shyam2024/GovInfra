from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.progress import ProgressLog
from app.models.project import Project
from app.models.user import User
from app.schemas.progress import ProgressCreate, ProgressLogOut


def _to_out(log: ProgressLog, project_name: str, submitted_by: str | None) -> ProgressLogOut:
    return ProgressLogOut(
        id=str(log.id),
        project_id=str(log.project_id),
        project_name=project_name,
        work_description=log.work_description,
        progress_percent=float(log.progress_percent),
        image_url=log.image_url,
        submitted_by=submitted_by,
        created_at=log.created_at.isoformat(),
    )


async def list_progress(db: AsyncSession, project_id: str | None) -> list[ProgressLogOut]:
    query = (
        select(ProgressLog, Project.name, User.full_name)
        .join(Project, ProgressLog.project_id == Project.id)
        .outerjoin(User, ProgressLog.submitted_by_id == User.id)
        .order_by(ProgressLog.created_at.desc())
    )
    if project_id:
        query = query.where(ProgressLog.project_id == project_id)
    result = await db.execute(query)
    return [_to_out(log, project_name, submitted_by) for log, project_name, submitted_by in result.all()]


async def create_progress(db: AsyncSession, payload: ProgressCreate, current_user: User) -> ProgressLogOut:
    project = await db.get(Project, payload.project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project not found")

    log = ProgressLog(
        project_id=payload.project_id,
        contractor_id=current_user.contractor_id,
        submitted_by_id=current_user.id,
        work_description=payload.work_description,
        progress_percent=payload.progress_percent,
        image_url=payload.image_url,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return _to_out(log, project.name, current_user.full_name)
