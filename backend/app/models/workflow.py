import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.guid import GUID
from app.models.enums import Priority, WorkflowStage
from app.models.mixins import TimestampMixin, UUIDPKMixin


class WorkflowFile(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "workflow_files"

    file_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("projects.id"), nullable=False)
    ra_bill_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), nullable=True)

    current_holder: Mapped[str] = mapped_column(String(150), nullable=False)
    current_department: Mapped[str] = mapped_column(String(150), nullable=False)
    current_stage: Mapped[WorkflowStage] = mapped_column(
    SAEnum(WorkflowStage, name="workflow_stage"),
    default=WorkflowStage.SUBMITTED,
    nullable=False,
    )
    priority: Mapped[Priority] = mapped_column(
    SAEnum(Priority, name="priority"),
    default=Priority.MEDIUM,
    nullable=False,)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Bumped on every stage change; "days pending" is measured from here.
    stage_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    project: Mapped["Project"] = relationship(back_populates="workflow_files")
    ra_bill: Mapped["RABill | None"] = relationship(
        "RABill", back_populates="workflow_file", foreign_keys="[RABill.workflow_file_id]", uselist=False, viewonly=True
    )
    history: Mapped[list["WorkflowHistory"]] = relationship(
        back_populates="workflow_file", cascade="all, delete-orphan", order_by="WorkflowHistory.timestamp.desc()"
    )
    payments: Mapped[list["Payment"]] = relationship(back_populates="workflow_file")


class WorkflowHistory(Base, UUIDPKMixin):
    __tablename__ = "workflow_history"

    workflow_file_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("workflow_files.id"), nullable=False)
    performed_by: Mapped[str] = mapped_column(String(150), nullable=False)
    department: Mapped[str] = mapped_column(String(150), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    from_state: Mapped[str | None] = mapped_column(String(50), nullable=True)
    to_state: Mapped[str | None] = mapped_column(String(50), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    workflow_file: Mapped["WorkflowFile"] = relationship(back_populates="history")
