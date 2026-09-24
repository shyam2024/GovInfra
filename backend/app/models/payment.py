import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.guid import GUID
from app.models.enums import PaymentStatus
from app.models.mixins import TimestampMixin, UUIDPKMixin


class Payment(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "payments"

    payment_reference: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    ra_bill_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("ra_bills.id"), nullable=False)
    workflow_file_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("workflow_files.id"), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
    SAEnum(PaymentStatus, name="payment_status"),
    default=PaymentStatus.READY,
    nullable=False,)
    released_by: Mapped[str | None] = mapped_column(String(150), nullable=True)
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    ra_bill: Mapped["RABill"] = relationship()
    workflow_file: Mapped["WorkflowFile | None"] = relationship(back_populates="payments")
