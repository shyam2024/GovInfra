from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.workflow import WorkflowActionRequest, WorkflowFileOut, WorkflowHistoryOut, WorkflowReturnRequest
from app.services import workflow_service

router = APIRouter(prefix="/workflow", tags=["Workflow"])


@router.get("/files", response_model=list[WorkflowFileOut])
async def list_files(db: DbSession, current_user: CurrentUser, project_id: str | None = None) -> list[WorkflowFileOut]:
    return await workflow_service.list_files(db, project_id)


@router.get("/files/{file_id}/history", response_model=list[WorkflowHistoryOut])
async def get_history(file_id: str, db: DbSession, current_user: CurrentUser) -> list[WorkflowHistoryOut]:
    return await workflow_service.get_history(db, file_id)


@router.post("/files/{file_id}/approve", response_model=WorkflowFileOut)
async def approve_file(file_id: str, payload: WorkflowActionRequest, db: DbSession, current_user: CurrentUser) -> WorkflowFileOut:
    return await workflow_service.approve(db, file_id, current_user, payload.remarks)


@router.post("/files/{file_id}/return", response_model=WorkflowFileOut)
async def return_file(file_id: str, payload: WorkflowReturnRequest, db: DbSession, current_user: CurrentUser) -> WorkflowFileOut:
    return await workflow_service.return_file(db, file_id, current_user, payload.remarks)
