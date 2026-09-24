from pydantic import BaseModel, BeforeValidator, ConfigDict
from typing import Annotated


class ORMModel(BaseModel):
    """Base for response schemas built from SQLAlchemy objects."""

    model_config = ConfigDict(from_attributes=True)


# UUID primary/foreign key columns come back from SQLAlchemy as uuid.UUID
# objects; the frontend's `Id` type is `number | string`, so every id field
# in a response schema is coerced to a plain string with this type.
IdStr = Annotated[str, BeforeValidator(lambda v: str(v) if v is not None else v)]


class ChartPoint(BaseModel):
    name: str
    value: float


class BudgetPoint(BaseModel):
    name: str
    budget: float
    spent: float


class MonthlyPaymentPoint(BaseModel):
    month: str
    amount: float


class ActivityItem(BaseModel):
    id: str
    officer: str
    department: str | None = None
    action: str
    remarks: str | None = None
    timestamp: str
