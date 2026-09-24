from datetime import date

from pydantic import BaseModel, Field

from app.models.enums import InspectionStatus
from app.schemas.common import IdStr, ORMModel


class InspectionCreate(BaseModel):
    project_id: str
    status: InspectionStatus
    remarks: str = Field(min_length=3)
    image_url: str | None = None
    inspection_date: date


class InspectionUpdate(BaseModel):
    status: InspectionStatus | None = None
    remarks: str | None = None
    image_url: str | None = None


class InspectionOut(ORMModel):
    id: IdStr
    project_id: IdStr
    project_name: str | None = None
    status: InspectionStatus
    remarks: str
    image_url: str | None = None
    inspection_date: date
    inspector_name: str | None = None
