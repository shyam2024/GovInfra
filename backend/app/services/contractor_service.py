from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.contractor import Contractor
from app.schemas.contractor import ContractorCreate, ContractorOut


async def list_contractors(db: AsyncSession) -> list[ContractorOut]:
    result = await db.execute(select(Contractor).order_by(Contractor.company_name))
    return [ContractorOut.from_model(c) for c in result.scalars().all()]


async def get_contractor(db: AsyncSession, contractor_id: str) -> ContractorOut:
    contractor = await db.get(Contractor, contractor_id)
    if not contractor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contractor not found")
    return ContractorOut.from_model(contractor)


async def create_contractor(db: AsyncSession, payload: ContractorCreate) -> ContractorOut:
    contractor = Contractor(
        company_name=payload.name,
        registration_no=payload.registration_no,
        email=payload.email,
        phone=payload.phone,
        contact_person=payload.contact_person,
        address=payload.address,
    )
    db.add(contractor)
    await db.commit()
    await db.refresh(contractor)
    return ContractorOut.from_model(contractor)


async def update_contractor(db: AsyncSession, contractor_id: str, payload: ContractorCreate) -> ContractorOut:
    contractor = await db.get(Contractor, contractor_id)
    if not contractor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contractor not found")
    contractor.company_name = payload.name
    contractor.registration_no = payload.registration_no
    contractor.email = payload.email
    contractor.phone = payload.phone
    contractor.contact_person = payload.contact_person
    contractor.address = payload.address
    await db.commit()
    await db.refresh(contractor)
    return ContractorOut.from_model(contractor)


async def delete_contractor(db: AsyncSession, contractor_id: str) -> None:
    contractor = await db.get(Contractor, contractor_id)
    if not contractor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contractor not found")
    await db.delete(contractor)
    await db.commit()
