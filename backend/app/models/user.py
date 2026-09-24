import uuid

from sqlalchemy import Boolean, Enum as SAEnum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.guid import GUID
from app.models.enums import Role
from app.models.mixins import TimestampMixin, UUIDPKMixin


class User(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(
    SAEnum(Role, name="role"),
    nullable=False,)
    department: Mapped[str | None] = mapped_column(String(150), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Deliberate extension beyond the original schema: links a CONTRACTOR-role
    # account to its Contractor company record, so "my projects" / "my bills"
    # can be scoped per logged-in contractor. Null for every other role.
    contractor_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("contractors.id"), nullable=True)
    contractor: Mapped["Contractor | None"] = relationship(back_populates="users")
