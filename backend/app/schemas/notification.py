from app.models.enums import NotificationType
from app.schemas.common import IdStr, ORMModel


class NotificationOut(ORMModel):
    id: IdStr
    title: str
    message: str
    is_read: bool
    type: NotificationType
    created_at: str
