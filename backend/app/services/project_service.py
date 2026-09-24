import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contractor import Contractor
from app.models.enums import PaymentStatus, ProjectStatus
from app.models.payment import Payment
from app.models.progress import ProgressLog
from app.models.project import Project
from app.models.ra_bill import RABill
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from app.services.numbering import next_project_code


async def _spent_by_project(db: AsyncSession, project_ids: list[uuid.UUID]) -> dict[uuid.UUID, float]:
    if not project_ids:
        return {}
    result = await db.execute(
        select(RABill.project_id, func.coalesce(func.sum(Payment.amount), 0))
        .join(Payment, Payment.ra_bill_id == RABill.id)
        .where(RABill.project_id.in_(project_ids), Payment.status == PaymentStatus.RELEASED)
        .group_by(RABill.project_id)
    )
    return {row[0]: float(row[1]) for row in result.all()}


async def _latest_progress_by_project(db: AsyncSession, project_ids: list[uuid.UUID]) -> dict[uuid.UUID, float]:
    if not project_ids:
        return {}
    result = await db.execute(
        select(ProgressLog.project_id, func.max(ProgressLog.created_at)).where(
            ProgressLog.project_id.in_(project_ids)
        ).group_by(ProgressLog.project_id)
    )
    latest_ts = {row[0]: row[1] for row in result.all()}
    if not latest_ts:
        return {}
    result = await db.execute(
        select(ProgressLog.project_id, ProgressLog.progress_percent).where(
            ProgressLog.project_id.in_(project_ids)
        ).order_by(ProgressLog.project_id, ProgressLog.created_at.desc())
    )
    out: dict[uuid.UUID, float] = {}
    for pid, pct in result.all():
        if pid not in out:
            out[pid] = float(pct)
    return out


def _to_out(project: Project, contractor_name: str | None, spent: float, progress_percent: float) -> ProjectOut:
    return ProjectOut(
        id=str(project.id),
        code=project.project_code,
        name=project.name,
        description=project.description,
        department=project.department,
        status=project.status,
        budget=float(project.budget),
        spent=spent,
        progress_percent=progress_percent,
        location=project.location,
        latitude=float(project.latitude) if project.latitude is not None else None,
        longitude=float(project.longitude) if project.longitude is not None else None,
        contractor_id=str(project.contractor_id) if project.contractor_id else None,
        contractor_name=contractor_name,
        start_date=project.start_date,
        end_date=project.expected_completion,
        created_at=project.created_at.isoformat() if project.created_at else None,
    )


async def list_projects(
    db: AsyncSession,
    search: str | None = None,
    status_filter: ProjectStatus | None = None,
    department: str | None = None,
) -> list[ProjectOut]:
    query = select(Project, Contractor.company_name).outerjoin(Contractor, Project.contractor_id == Contractor.id)
    if search:
        like = f"%{search.lower()}%"
        query = query.where(func.lower(Project.name).like(like) | func.lower(Project.project_code).like(like))
    if status_filter:
        query = query.where(Project.status == status_filter)
    if department:
        query = query.where(Project.department == department)
    query = query.order_by(Project.created_at.desc())

    result = await db.execute(query)
    rows = result.all()
    project_ids = [p.id for p, _ in rows]
    spent_map = await _spent_by_project(db, project_ids)
    progress_map = await _latest_progress_by_project(db, project_ids)

    return [
        _to_out(project, contractor_name, spent_map.get(project.id, 0.0), progress_map.get(project.id, 0.0))
        for project, contractor_name in rows
    ]


async def get_project(db: AsyncSession, project_id: str) -> ProjectOut:
    result = await db.execute(
        select(Project, Contractor.company_name)
        .outerjoin(Contractor, Project.contractor_id == Contractor.id)
        .where(Project.id == project_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    project, contractor_name = row
    spent_map = await _spent_by_project(db, [project.id])
    progress_map = await _latest_progress_by_project(db, [project.id])
    return _to_out(project, contractor_name, spent_map.get(project.id, 0.0), progress_map.get(project.id, 0.0))


async def create_project(db: AsyncSession, payload: ProjectCreate, created_by: uuid.UUID) -> ProjectOut:
    if payload.contractor_id:
        contractor = await db.get(Contractor, payload.contractor_id)
        if not contractor:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Contractor not found")

    project = Project(
        project_code=await next_project_code(db),
        name=payload.name,
        description=payload.description,
        department=payload.department,
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        budget=payload.budget,
        status=ProjectStatus.PLANNED,
        start_date=payload.start_date,
        expected_completion=payload.end_date,
        contractor_id=payload.contractor_id,
        created_by=created_by,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return await get_project(db, str(project.id))


async def update_project(db: AsyncSession, project_id: str, payload: ProjectUpdate) -> ProjectOut:
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    data = payload.model_dump(exclude_unset=True)
    if "end_date" in data:
        project.expected_completion = data.pop("end_date")
    for field, value in data.items():
        setattr(project, field, value)

    await db.commit()
    await db.refresh(project)
    return await get_project(db, str(project.id))


async def delete_project(db: AsyncSession, project_id: str) -> None:
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    await db.delete(project)
    await db.commit()


async def list_contractors_raw(db: AsyncSession) -> list[Contractor]:
    result = await db.execute(select(Contractor).order_by(Contractor.company_name))
    return list(result.scalars().all())
