from app.models.enums import Role
from app.schemas.common import IdStr, ORMModel


class UserOut(ORMModel):
    id: IdStr
    email: str
    full_name: str
    role: Role
    department: str | None = None
    is_active: bool
