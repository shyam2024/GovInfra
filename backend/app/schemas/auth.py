from pydantic import BaseModel, EmailStr

from app.models.enums import Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Role
    department: str | None = None
    contractor_id: str | None = None
