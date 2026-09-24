import uuid
from datetime import date

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.guid import GUID
from app.models.enums import ProjectStatus
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Project(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "projects"

    project_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(250), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    department: Mapped[str | None] = mapped_column(String(150), nullable=True)
    location: Mapped[str | None] = mapped_column(String(250), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    budget: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    status: Mapped[ProjectStatus] = mapped_column(
    SAEnum(ProjectStatus, name="project_status"),
    default=ProjectStatus.PLANNED,
    nullable=False,
    )
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expected_completion: Mapped[date | None] = mapped_column(Date, nullable=True)

    contractor_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("contractors.id"), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("users.id"), nullable=True)

    contractor: Mapped["Contractor | None"] = relationship(back_populates="projects")
    progress_logs: Mapped[list["ProgressLog"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    inspections: Mapped[list["Inspection"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    ra_bills: Mapped[list["RABill"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    workflow_files: Mapped[list["WorkflowFile"]] = relationship(back_populates="project", cascade="all, delete-orphan")
