"""Seed demo data by driving the real service layer — the exact same code
paths the API uses — so the demo dataset is guaranteed consistent with how
the app actually behaves (bill submission really creates a workflow file,
approvals really create Payment rows, etc).

Creates: 5 users (one per role), 2 contractors, 3 projects, a handful of
progress logs, 3 inspections, 5 RA bills (which produce 5 workflow files,
one sitting at each Kanban stage), and 2 released payments.

Usage:
    python seed/seed.py
"""

import asyncio
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402

from app.core.database import AsyncSessionLocal, Base, engine  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app import models  # noqa: E402,F401
from app.models.contractor import Contractor  # noqa: E402
from app.models.enums import InspectionStatus, ProjectStatus, Role  # noqa: E402
from app.models.project import Project  # noqa: E402
from app.models.user import User  # noqa: E402
from app.schemas.inspection import InspectionCreate  # noqa: E402
from app.schemas.progress import ProgressCreate  # noqa: E402
from app.schemas.project import ProjectCreate  # noqa: E402
from app.schemas.ra_bill import RABillCreate  # noqa: E402
from app.services import billing_service, inspection_service, progress_service, project_service, workflow_service  # noqa: E402


async def get_or_create_user(db, *, full_name, email, password, role, department=None, contractor_id=None) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        return user
    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        role=role,
        department=department,
        contractor_id=contractor_id,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def main() -> None:
    # Make sure tables exist (safe no-op if Alembic already created them).
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        existing_admin = await db.execute(select(User).where(User.email == "admin@demo.com"))
        if existing_admin.scalar_one_or_none():
            print("Seed data already present — skipping (delete the DB / tables to reseed).")
            return

        # ---- Contractors ----
        c1 = Contractor(
            company_name="Shree Constructions Pvt Ltd",
            registration_no="GJ/CONTR/2019/00412",
            contact_person="Rakesh Patel",
            email="contact@shreeconstructions.example",
            phone="+91 98250 11223",
            address="Nr. GIDC, Vatva, Ahmedabad, Gujarat",
        )
        c2 = Contractor(
            company_name="Narmada Infra Works",
            registration_no="GJ/CONTR/2016/00187",
            contact_person="Mitesh Chauhan",
            email="ops@narmadainfra.example",
            phone="+91 98240 55667",
            address="Old NH-8, Bharuch, Gujarat",
        )
        db.add_all([c1, c2])
        await db.commit()
        await db.refresh(c1)
        await db.refresh(c2)

        # ---- Users (one per role; demo credentials match the frontend's login screen) ----
        admin = await get_or_create_user(db, full_name="Anjali Desai", email="admin@demo.com", password="admin123", role=Role.ADMIN, department="Administration")
        contractor_user = await get_or_create_user(
            db, full_name="Rakesh Patel", email="contractor@demo.com", password="contractor123", role=Role.CONTRACTOR, contractor_id=c1.id
        )
        engineer = await get_or_create_user(db, full_name="Sanjay Trivedi", email="engineer@demo.com", password="engineer123", role=Role.ENGINEER, department="Engineering")
        finance = await get_or_create_user(db, full_name="Priya Shah", email="finance@demo.com", password="finance123", role=Role.FINANCE, department="Finance")
        treasury = await get_or_create_user(db, full_name="Kiran Joshi", email="treasury@demo.com", password="treasury123", role=Role.TREASURY, department="Treasury")

        # ---- Projects ----
        p1 = await project_service.create_project(
            db,
            ProjectCreate(
                name="Narmada Canal Bridge — Package 4",
                description="Construction of a 4-lane RCC bridge over the Narmada branch canal, including approach roads.",
                contractor_id=str(c2.id),
                budget=45_000_000,
                location="Bharuch, Gujarat",
                latitude=21.7051,
                longitude=72.9959,
                start_date=date.today() - timedelta(days=210),
                end_date=date.today() + timedelta(days=150),
                department="Roads & Buildings",
            ),
            created_by=admin.id,
        )
        p2 = await project_service.create_project(
            db,
            ProjectCreate(
                name="Ahmedabad Ring Road Widening",
                description="Widening of the SG Highway ring road stretch from 4 lanes to 6 lanes with service roads.",
                contractor_id=str(c1.id),
                budget=120_000_000,
                location="Ahmedabad, Gujarat",
                latitude=23.0225,
                longitude=72.5714,
                start_date=date.today() - timedelta(days=400),
                end_date=date.today() + timedelta(days=60),
                department="Roads & Buildings",
            ),
            created_by=admin.id,
        )
        p3 = await project_service.create_project(
            db,
            ProjectCreate(
                name="Rajkot Water Treatment Plant",
                description="60 MLD capacity water treatment plant upgrade with new filtration units.",
                contractor_id=str(c1.id),
                budget=30_000_000,
                location="Rajkot, Gujarat",
                latitude=22.3039,
                longitude=70.8022,
                start_date=date.today() + timedelta(days=20),
                department="Water Supply",
            ),
            created_by=admin.id,
        )

        # Bump a couple of projects to ACTIVE (default on create is PLANNED).
        for pid in (p1.id, p2.id):
            proj = await db.get(Project, pid)
            proj.status = ProjectStatus.ACTIVE
        await db.commit()

        # ---- Progress logs ----
        await progress_service.create_progress(
            db, ProgressCreate(project_id=p1.id, work_description="Completed pier foundation casting for spans 1–3.", progress_percent=35), contractor_user
        )
        await progress_service.create_progress(
            db, ProgressCreate(project_id=p1.id, work_description="Pier caps and bearings installed for span 1.", progress_percent=48), contractor_user
        )
        await progress_service.create_progress(
            db, ProgressCreate(project_id=p2.id, work_description="Widening earthwork complete for chainage 0–4km.", progress_percent=62), contractor_user
        )

        # ---- Inspections ----
        await inspection_service.create_inspection(
            db,
            InspectionCreate(project_id=p1.id, status=InspectionStatus.PASS_, remarks="Foundation reinforcement matches approved drawings. Concrete cube test results within spec.", inspection_date=date.today() - timedelta(days=14)),
            engineer,
        )
        await inspection_service.create_inspection(
            db,
            InspectionCreate(project_id=p2.id, status=InspectionStatus.FAIL, remarks="Compaction density below required 95% MDD on chainage 2.5km stretch. Re-work ordered.", inspection_date=date.today() - timedelta(days=9)),
            engineer,
        )
        await inspection_service.create_inspection(
            db,
            InspectionCreate(project_id=p2.id, status=InspectionStatus.PASS_, remarks="Re-compaction verified, density now meets spec. Cleared for RA bill.", inspection_date=date.today() - timedelta(days=3)),
            engineer,
        )

        # ---- RA Bills -> Workflow files (one bill per target Kanban stage) ----
        async def make_bill(project_id: str, gross: float, gst: float, retention: float, as_user: User):
            bill = await billing_service.create_bill(db, RABillCreate(project_id=project_id, gross_amount=gross, gst=gst, retention=retention), as_user)
            return await billing_service.submit_bill(db, bill.id, as_user)

        bill_submitted = await make_bill(p1.id, 4_200_000, 756_000, 210_000, contractor_user)  # stays at SUBMITTED

        bill_engineer = await make_bill(p1.id, 6_800_000, 1_224_000, 340_000, contractor_user)
        await workflow_service.approve(db, bill_engineer.workflow_file_id, admin, "Intake reviewed, forwarded to engineering.")
        # now at ENGINEER_REVIEW

        bill_finance = await make_bill(p2.id, 12_500_000, 2_250_000, 625_000, contractor_user)
        await workflow_service.approve(db, bill_finance.workflow_file_id, admin, "Intake reviewed, forwarded to engineering.")
        await workflow_service.approve(db, bill_finance.workflow_file_id, engineer, "Quality checks cleared.")
        # now at FINANCE_REVIEW

        bill_paid_1 = await make_bill(p2.id, 9_000_000, 1_620_000, 450_000, contractor_user)
        await workflow_service.approve(db, bill_paid_1.workflow_file_id, admin, "Intake reviewed, forwarded to engineering.")
        await workflow_service.approve(db, bill_paid_1.workflow_file_id, engineer, "Approved.")
        await workflow_service.approve(db, bill_paid_1.workflow_file_id, finance, "Amounts verified against contract schedule.")
        # now at TREASURY (a Payment row is READY here)

        bill_paid_2 = await make_bill(p1.id, 3_100_000, 558_000, 155_000, contractor_user)
        await workflow_service.approve(db, bill_paid_2.workflow_file_id, admin, "Intake reviewed, forwarded to engineering.")
        await workflow_service.approve(db, bill_paid_2.workflow_file_id, engineer, "Approved.")
        await workflow_service.approve(db, bill_paid_2.workflow_file_id, finance, "Approved.")
        await workflow_service.approve(db, bill_paid_2.workflow_file_id, treasury, "Payment released to contractor.")
        # now PAID, payment RELEASED

        print("Seed complete:")
        print(f"  Contractors: 2   Users: 5   Projects: 3")
        print(f"  RA Bills: 5      Workflow files: 5 (one at each Kanban stage)")
        print(f"  Inspections: 3   Released payments: 2")
        print()
        print("Demo logins (all on this login screen's one-tap buttons too):")
        print("  admin@demo.com      / admin123")
        print("  contractor@demo.com / contractor123")
        print("  engineer@demo.com   / engineer123")
        print("  finance@demo.com    / finance123")
        print("  treasury@demo.com   / treasury123")


if __name__ == "__main__":
    asyncio.run(main())
