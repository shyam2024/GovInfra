from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DbSession, require_roles
from app.models.enums import Role
from app.schemas.contractor import ContractorCreate, ContractorOut
from app.services import contractor_service

router = APIRouter(prefix="/contractors", tags=["Contractors"])


@router.get("", response_model=list[ContractorOut])
async def list_contractors(db: DbSession, current_user: CurrentUser) -> list[ContractorOut]:
    return await contractor_service.list_contractors(db)


@router.post("", response_model=ContractorOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles(Role.ADMIN))])
async def create_contractor(payload: ContractorCreate, db: DbSession) -> ContractorOut:
    return await contractor_service.create_contractor(db, payload)


@router.get("/{contractor_id}", response_model=ContractorOut)
async def get_contractor(contractor_id: str, db: DbSession, current_user: CurrentUser) -> ContractorOut:
    return await contractor_service.get_contractor(db, contractor_id)


@router.put("/{contractor_id}", response_model=ContractorOut, dependencies=[Depends(require_roles(Role.ADMIN))])
async def update_contractor(contractor_id: str, payload: ContractorCreate, db: DbSession) -> ContractorOut:
    return await contractor_service.update_contractor(db, contractor_id, payload)


@router.delete("/{contractor_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_roles(Role.ADMIN))])
async def delete_contractor(contractor_id: str, db: DbSession) -> None:
    await contractor_service.delete_contractor(db, contractor_id)
