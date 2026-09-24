"""Import every model so Base.metadata is fully populated (needed for
Alembic autogeneration and for the create_all dev bootstrap script)."""

from app.models.contractor import Contractor  # noqa: F401
from app.models.enums import (  # noqa: F401
    InspectionStatus,
    NotificationType,
    PaymentStatus,
    Priority,
    ProjectStatus,
    RABillStatus,
    Role,
    WorkflowStage,
)
from app.models.inspection import Inspection  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.payment import Payment  # noqa: F401
from app.models.progress import ProgressLog  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.ra_bill import RABill  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.workflow import WorkflowFile, WorkflowHistory  # noqa: F401
