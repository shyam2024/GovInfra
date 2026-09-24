from pydantic import BaseModel, Field

from app.models.enums import RABillStatus
from app.schemas.common import IdStr, ORMModel


class RABillCreate(BaseModel):
    project_id: str
    gross_amount: float = Field(gt=0)
    gst: float = Field(ge=0, default=0)
    retention: float = Field(ge=0, default=0)


class RABillOut(ORMModel):
    id: IdStr
    bill_no: str
    project_id: IdStr
    project_name: str | None = None
    contractor_name: str | None = None
    gross_amount: float
    gst: float
    retention: float
    net_amount: float
    status: RABillStatus
    workflow_file_id: IdStr | None = None
    created_at: str | None = None
