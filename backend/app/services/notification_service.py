import uuid

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import NotificationType, Role
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut


def _to_out(n: Notification) -> NotificationOut:
    return NotificationOut(
        id=str(n.id),
        title=n.title,
        message=n.message,
        is_read=n.is_read,
        type=n.type,
        created_at=n.created_at.isoformat(),
    )


async def list_notifications(db: AsyncSession, user_id: uuid.UUID) -> list[NotificationOut]:
    result = await db.execute(
        select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc()).limit(100)
    )
    return [_to_out(n) for n in result.scalars().all()]


async def mark_read(db: AsyncSession, user_id: uuid.UUID, notification_id: str) -> None:
    notification = await db.get(Notification, notification_id)
    if not notification or notification.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notification.is_read = True
    await db.commit()


async def mark_all_read(db: AsyncSession, user_id: uuid.UUID) -> None:
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
        .values(is_read=True)
    )
    await db.commit()


async def notify_user(db: AsyncSession, user_id: uuid.UUID, title: str, message: str, ntype: NotificationType = NotificationType.INFO) -> None:
    db.add(Notification(user_id=user_id, title=title, message=message, type=ntype, is_read=False))


async def notify_role(db: AsyncSession, role: Role, title: str, message: str, ntype: NotificationType = NotificationType.INFO) -> None:
    result = await db.execute(select(User.id).where(User.role == role, User.is_active == True))  # noqa: E712
    for (user_id,) in result.all():
        db.add(Notification(user_id=user_id, title=title, message=message, type=ntype, is_read=False))
