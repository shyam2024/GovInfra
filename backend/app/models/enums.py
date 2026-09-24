"""Enums shared by models and schemas.

Values are kept identical to the frontend's TypeScript union types
(src/types/index.ts in the GovInfra Gujarat frontend) so API responses need
no relabeling on the client.
"""

import enum


class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    CONTRACTOR = "CONTRACTOR"
    ENGINEER = "ENGINEER"
    FINANCE = "FINANCE"
    TREASURY = "TREASURY"


class ProjectStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class InspectionStatus(str, enum.Enum):
    PASS_ = "PASS"
    FAIL = "FAIL"


class WorkflowStage(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    ENGINEER_REVIEW = "ENGINEER_REVIEW"
    FINANCE_REVIEW = "FINANCE_REVIEW"
    TREASURY = "TREASURY"
    PAID = "PAID"


class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class RABillStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    RETURNED = "RETURNED"
    APPROVED = "APPROVED"
    PAID = "PAID"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    READY = "READY"
    RELEASED = "RELEASED"


class NotificationType(str, enum.Enum):
    INFO = "INFO"
    ACTION = "ACTION"
    WARNING = "WARNING"
    SUCCESS = "SUCCESS"


# Ordered stage sequence the workflow engine advances through on approve().
WORKFLOW_SEQUENCE: list[WorkflowStage] = [
    WorkflowStage.SUBMITTED,
    WorkflowStage.ENGINEER_REVIEW,
    WorkflowStage.FINANCE_REVIEW,
    WorkflowStage.TREASURY,
    WorkflowStage.PAID,
]

# Which role acts on which stage (mirrors the frontend's STAGE_OWNER map).
# A stage with no entry here can only be advanced by ADMIN.
STAGE_OWNER: dict[WorkflowStage, Role] = {
    WorkflowStage.ENGINEER_REVIEW: Role.ENGINEER,
    WorkflowStage.FINANCE_REVIEW: Role.FINANCE,
    WorkflowStage.TREASURY: Role.TREASURY,
}

STAGE_HOLDER_LABEL: dict[WorkflowStage, str] = {
    WorkflowStage.SUBMITTED: "Admin Intake",
    WorkflowStage.ENGINEER_REVIEW: "Engineering Department",
    WorkflowStage.FINANCE_REVIEW: "Finance Department",
    WorkflowStage.TREASURY: "Treasury Department",
    WorkflowStage.PAID: "Completed",
}
