import uuid

from sqlalchemy import Enum as SAEnum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.guid import GUID
from app.models.enums import RABillStatus
from app.models.mixins import TimestampMixin, UUIDPKMixin


class RABill(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "ra_bills"

    bill_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("projects.id"), nullable=False)
    contractor_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("contractors.id"), nullable=True)

    gross_amount: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    gst: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False, default=0)
    retention: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False, default=0)
    net_amount: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)

    status: Mapped[RABillStatus] = mapped_column(
    SAEnum(RABillStatus, name="ra_bill_status"),
    default=RABillStatus.DRAFT,
    nullable=False,)
    workflow_file_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("workflow_files.id"), nullable=True)

    project: Mapped["Project"] = relationship(back_populates="ra_bills")
    workflow_file: Mapped["WorkflowFile | None"] = relationship(
        back_populates="ra_bill", foreign_keys=[workflow_file_id], post_update=True
    )
