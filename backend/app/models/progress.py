import uuid

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.guid import GUID
from app.models.mixins import TimestampMixin, UUIDPKMixin


class ProgressLog(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "progress_logs"

    project_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("projects.id"), nullable=False)
    contractor_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("contractors.id"), nullable=True)
    submitted_by_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("users.id"), nullable=True)
    work_description: Mapped[str] = mapped_column(Text, nullable=False)
    progress_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    project: Mapped["Project"] = relationship(back_populates="progress_logs")
