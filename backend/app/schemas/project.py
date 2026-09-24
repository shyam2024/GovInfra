from datetime import date

from pydantic import BaseModel, Field

from app.models.enums import ProjectStatus
from app.schemas.common import IdStr, ORMModel


class ProjectCreate(BaseModel):
    name: str = Field(min_length=3)
    description: str | None = None
    contractor_id: str | None = None
    budget: float = Field(gt=0)
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    department: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    contractor_id: str | None = None
    budget: float | None = None
    status: ProjectStatus | None = None
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    department: str | None = None


class ProjectOut(ORMModel):
    id: IdStr
    code: str | None = None
    name: str
    description: str | None = None
    department: str | None = None
    status: ProjectStatus
    budget: float
    spent: float = 0
    progress_percent: float = 0
    location: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    contractor_id: IdStr | None = None
    contractor_name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    created_at: str | None = None
