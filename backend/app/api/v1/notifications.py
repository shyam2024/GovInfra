from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.notification import NotificationOut
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationOut])
async def list_notifications(db: DbSession, current_user: CurrentUser) -> list[NotificationOut]:
    return await notification_service.list_notifications(db, current_user.id)


@router.post("/{notification_id}/read")
async def mark_read(notification_id: str, db: DbSession, current_user: CurrentUser) -> dict:
    await notification_service.mark_read(db, current_user.id, notification_id)
    return {"success": True}


@router.post("/read-all")
async def mark_all_read(db: DbSession, current_user: CurrentUser) -> dict:
    await notification_service.mark_all_read(db, current_user.id)
    return {"success": True}
