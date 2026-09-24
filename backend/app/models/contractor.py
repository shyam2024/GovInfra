from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Contractor(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "contractors"

    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    registration_no: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_person: Mapped[str | None] = mapped_column(String(150), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)

    users: Mapped[list["User"]] = relationship(back_populates="contractor")
    projects: Mapped[list["Project"]] = relationship(back_populates="contractor")
