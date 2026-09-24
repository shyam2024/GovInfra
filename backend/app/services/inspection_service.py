from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inspection import Inspection
from app.models.project import Project
from app.models.user import User
from app.schemas.inspection import InspectionCreate, InspectionOut, InspectionUpdate


def _to_out(inspection: Inspection, project_name: str, inspector_name: str | None) -> InspectionOut:
    return InspectionOut(
        id=str(inspection.id),
        project_id=str(inspection.project_id),
        project_name=project_name,
        status=inspection.status,
        remarks=inspection.remarks,
        image_url=inspection.image_url,
        inspection_date=inspection.inspection_date,
        inspector_name=inspector_name,
    )


async def list_inspections(db: AsyncSession, project_id: str | None) -> list[InspectionOut]:
    query = (
        select(Inspection, Project.name, User.full_name)
        .join(Project, Inspection.project_id == Project.id)
        .outerjoin(User, Inspection.engineer_id == User.id)
        .order_by(Inspection.inspection_date.desc(), Inspection.created_at.desc())
    )
    if project_id:
        query = query.where(Inspection.project_id == project_id)
    result = await db.execute(query)
    return [_to_out(i, project_name, inspector_name) for i, project_name, inspector_name in result.all()]


async def create_inspection(db: AsyncSession, payload: InspectionCreate, current_user: User) -> InspectionOut:
    project = await db.get(Project, payload.project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project not found")

    inspection = Inspection(
        project_id=payload.project_id,
        engineer_id=current_user.id,
        inspection_date=payload.inspection_date,
        status=payload.status,
        remarks=payload.remarks,
        image_url=payload.image_url,
    )
    db.add(inspection)
    await db.commit()
    await db.refresh(inspection)
    return _to_out(inspection, project.name, current_user.full_name)


async def update_inspection(db: AsyncSession, inspection_id: str, payload: InspectionUpdate) -> InspectionOut:
    inspection = await db.get(Inspection, inspection_id)
    if not inspection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inspection not found")

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(inspection, field, value)
    await db.commit()
    await db.refresh(inspection)

    project = await db.get(Project, inspection.project_id)
    engineer = await db.get(User, inspection.engineer_id) if inspection.engineer_id else None
    return _to_out(inspection, project.name if project else "", engineer.full_name if engineer else None)
