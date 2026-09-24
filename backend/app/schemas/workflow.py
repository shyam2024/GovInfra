from pydantic import BaseModel

from app.models.enums import Priority, WorkflowStage
from app.schemas.common import IdStr, ORMModel


class WorkflowActionRequest(BaseModel):
    remarks: str | None = None


class WorkflowReturnRequest(BaseModel):
    remarks: str


class WorkflowFileOut(ORMModel):
    id: IdStr
    file_number: str
    project_id: IdStr
    project_name: str
    bill_id: IdStr | None = None
    priority: Priority
    current_stage: WorkflowStage
    current_holder: str
    days_pending: int
    remarks: str | None = None
    created_at: str | None = None


class WorkflowHistoryOut(ORMModel):
    id: IdStr
    file_id: IdStr
    officer: str
    department: str
    action: str
    remarks: str | None = None
    timestamp: str
