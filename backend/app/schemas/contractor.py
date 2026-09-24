from pydantic import BaseModel, Field

from app.schemas.common import IdStr, ORMModel


class ContractorCreate(BaseModel):
    name: str = Field(min_length=2)
    registration_no: str | None = None
    email: str | None = None
    phone: str | None = None
    contact_person: str | None = None
    address: str | None = None


class ContractorOut(ORMModel):
    id: IdStr
    name: str
    registration_no: str | None = None
    email: str | None = None
    phone: str | None = None

    @classmethod
    def from_model(cls, m) -> "ContractorOut":
        return cls(id=str(m.id), name=m.company_name, registration_no=m.registration_no, email=m.email, phone=m.phone)
