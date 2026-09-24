from pydantic import BaseModel, Field

from app.schemas.common import IdStr, ORMModel


class ProgressCreate(BaseModel):
    project_id: str
    work_description: str = Field(min_length=3)
    progress_percent: float = Field(ge=0, le=100)
    image_url: str | None = None


class ProgressLogOut(ORMModel):
    id: IdStr
    project_id: IdStr
    project_name: str | None = None
    work_description: str
    progress_percent: float
    image_url: str | None = None
    submitted_by: str | None = None
    created_at: str
