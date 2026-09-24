import uuid
from datetime import date

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.guid import GUID
from app.models.enums import InspectionStatus
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Inspection(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "inspections"

    project_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("projects.id"), nullable=False)
    engineer_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("users.id"), nullable=True)
    inspection_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[InspectionStatus] = mapped_column(
    SAEnum(InspectionStatus, name="inspection_status"),
    nullable=False,)
    remarks: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    project: Mapped["Project"] = relationship(back_populates="inspections")
