from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, DbSession, require_roles
from app.models.enums import Role
from app.schemas.dashboard import DashboardSummaryOut
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardSummaryOut)
async def summary(db: DbSession, current_user: CurrentUser) -> DashboardSummaryOut:
    return await dashboard_service.get_summary(db, current_user)


@router.get("/analytics", response_model=DashboardSummaryOut, dependencies=[Depends(require_roles(Role.ADMIN))])
async def analytics(db: DbSession) -> DashboardSummaryOut:
    return await dashboard_service.get_analytics(db)
