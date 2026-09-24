from fastapi import APIRouter

from app.api.v1 import auth, contractors, dashboard, inspections, notifications, payments, progress, projects, ra_bills, workflow

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(contractors.router)
api_router.include_router(progress.router)
api_router.include_router(inspections.router)
api_router.include_router(ra_bills.router)
api_router.include_router(workflow.router)
api_router.include_router(payments.router)
api_router.include_router(dashboard.router)
api_router.include_router(notifications.router)
