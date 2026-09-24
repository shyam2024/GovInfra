"""Sequential, year-scoped reference numbers (file numbers, bill numbers,
payment references, project codes). Good enough for a single-instance demo
deployment; a high-concurrency production system would move this to a DB
sequence, but the COUNT-based approach here is simple, portable across
Postgres and SQLite, and adequate for GovInfra Gujarat's traffic profile."""

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def _count(db: AsyncSession, model) -> int:
    result = await db.execute(select(func.count()).select_from(model))
    return result.scalar_one()


async def next_project_code(db: AsyncSession) -> str:
    from app.models.project import Project

    year = datetime.now(timezone.utc).year
    n = await _count(db, Project) + 1
    return f"GIG-{year}-{n:03d}"


async def next_file_number(db: AsyncSession) -> str:
    from app.models.workflow import WorkflowFile

    year = datetime.now(timezone.utc).year
    n = await _count(db, WorkflowFile) + 1
    return f"WF-{year}-{n:05d}"


async def next_bill_number(db: AsyncSession) -> str:
    from app.models.ra_bill import RABill

    year = datetime.now(timezone.utc).year
    n = await _count(db, RABill) + 1
    return f"RA-{year}-{n:04d}"


async def next_payment_reference(db: AsyncSession) -> str:
    from app.models.payment import Payment

    year = datetime.now(timezone.utc).year
    n = await _count(db, Payment) + 1
    return f"PAY-{year}-{n:05d}"
