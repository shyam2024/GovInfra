"""Initial schema — users, contractors, projects, progress_logs, inspections,
workflow_files, workflow_history, ra_bills, payments, notifications.

Revision ID: 0001
Revises:
Create Date: 2026-09-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op
from app.models.enums import (
    InspectionStatus,
    NotificationType,
    PaymentStatus,
    Priority,
    ProjectStatus,
    RABillStatus,
    Role,
    WorkflowStage,
)

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

UUID = postgresql.UUID(as_uuid=True)


def upgrade() -> None:
    op.create_table(
        "contractors",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("company_name", sa.String(200), nullable=False),
        sa.Column("registration_no", sa.String(100), nullable=True),
        sa.Column("contact_person", sa.String(150), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(30), nullable=True),
        sa.Column("address", sa.String(300), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "users",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum(Role, name="role"), nullable=False),
        sa.Column("department", sa.String(150), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("contractor_id", UUID, sa.ForeignKey("contractors.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "projects",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("project_code", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(250), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("department", sa.String(150), nullable=True),
        sa.Column("location", sa.String(250), nullable=True),
        sa.Column("latitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("longitude", sa.Numeric(9, 6), nullable=True),
        sa.Column("budget", sa.Numeric(16, 2), nullable=False),
        sa.Column("status", sa.Enum(ProjectStatus, name="project_status"), nullable=False, server_default=ProjectStatus.PLANNED.value),
        sa.Column("start_date", sa.Date, nullable=True),
        sa.Column("expected_completion", sa.Date, nullable=True),
        sa.Column("contractor_id", UUID, sa.ForeignKey("contractors.id"), nullable=True),
        sa.Column("created_by", UUID, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "progress_logs",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("project_id", UUID, sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("contractor_id", UUID, sa.ForeignKey("contractors.id"), nullable=True),
        sa.Column("submitted_by_id", UUID, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("work_description", sa.Text, nullable=False),
        sa.Column("progress_percent", sa.Numeric(5, 2), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "inspections",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("project_id", UUID, sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("engineer_id", UUID, sa.ForeignKey("users.id"), nullable=True),
        sa.Column("inspection_date", sa.Date, nullable=False),
        sa.Column("status", sa.Enum(InspectionStatus, name="inspection_status"), nullable=False),
        sa.Column("remarks", sa.Text, nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "workflow_files",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("file_number", sa.String(50), nullable=False, unique=True),
        sa.Column("project_id", UUID, sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("ra_bill_id", UUID, nullable=True),
        sa.Column("current_holder", sa.String(150), nullable=False),
        sa.Column("current_department", sa.String(150), nullable=False),
        sa.Column(
            "current_stage",
            sa.Enum(WorkflowStage, name="workflow_stage"),
            nullable=False,
            server_default=WorkflowStage.SUBMITTED.value,
        ),
        sa.Column("priority", sa.Enum(Priority, name="priority"), nullable=False, server_default=Priority.MEDIUM.value),
        sa.Column("remarks", sa.Text, nullable=True),
        sa.Column("stage_updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "ra_bills",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("bill_number", sa.String(50), nullable=False, unique=True),
        sa.Column("project_id", UUID, sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("contractor_id", UUID, sa.ForeignKey("contractors.id"), nullable=True),
        sa.Column("gross_amount", sa.Numeric(16, 2), nullable=False),
        sa.Column("gst", sa.Numeric(16, 2), nullable=False, server_default="0"),
        sa.Column("retention", sa.Numeric(16, 2), nullable=False, server_default="0"),
        sa.Column("net_amount", sa.Numeric(16, 2), nullable=False),
        sa.Column("status", sa.Enum(RABillStatus, name="ra_bill_status"), nullable=False, server_default=RABillStatus.DRAFT.value),
        sa.Column("workflow_file_id", UUID, sa.ForeignKey("workflow_files.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "payments",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("payment_reference", sa.String(50), nullable=False, unique=True),
        sa.Column("ra_bill_id", UUID, sa.ForeignKey("ra_bills.id"), nullable=False),
        sa.Column("workflow_file_id", UUID, sa.ForeignKey("workflow_files.id"), nullable=True),
        sa.Column("amount", sa.Numeric(16, 2), nullable=False),
        sa.Column("status", sa.Enum(PaymentStatus, name="payment_status"), nullable=False, server_default=PaymentStatus.READY.value),
        sa.Column("released_by", sa.String(150), nullable=True),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "workflow_history",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("workflow_file_id", UUID, sa.ForeignKey("workflow_files.id"), nullable=False),
        sa.Column("performed_by", sa.String(150), nullable=False),
        sa.Column("department", sa.String(150), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("from_state", sa.String(50), nullable=True),
        sa.Column("to_state", sa.String(50), nullable=True),
        sa.Column("remarks", sa.Text, nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "notifications",
        sa.Column("id", UUID, primary_key=True),
        sa.Column("user_id", UUID, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("type", sa.Enum(NotificationType, name="notification_type"), nullable=False, server_default=NotificationType.INFO.value),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("workflow_history")
    op.drop_table("payments")
    op.drop_table("ra_bills")
    op.drop_table("workflow_files")
    op.drop_table("inspections")
    op.drop_table("progress_logs")
    op.drop_table("projects")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.drop_table("contractors")

    # Drop the native Postgres enum types created above.
    for enum_name in (
        "notification_type",
        "payment_status",
        "ra_bill_status",
        "priority",
        "workflow_stage",
        "inspection_status",
        "project_status",
        "role",
    ):
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)
