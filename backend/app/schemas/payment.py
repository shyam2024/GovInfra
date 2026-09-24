from app.models.enums import PaymentStatus
from app.schemas.common import IdStr, ORMModel


class PaymentOut(ORMModel):
    id: IdStr
    bill_id: IdStr
    bill_no: str
    contractor_name: str
    amount: float
    status: PaymentStatus
    released_at: str | None = None
