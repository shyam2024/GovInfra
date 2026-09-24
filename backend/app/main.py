from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Government Infrastructure Lifecycle & Workflow Management Platform — REST API.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=settings.cors_origin_list != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Flatten Pydantic's error list into a readable "detail" string —
    # the frontend's getErrorMessage() reads either a string or this list shape.
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"detail": exc.errors()})


@app.get("/", tags=["Health"])
async def root() -> dict:
    return {"service": settings.PROJECT_NAME, "status": "ok"}


@app.get("/health", tags=["Health"])
async def health() -> dict:
    return {"status": "ok"}


app.include_router(api_router, prefix=settings.API_V1_PREFIX)
