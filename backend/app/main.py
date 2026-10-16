"""
Electricity Theft Intelligence & Inspection Platform
FastAPI Application Entry Point
"""

import sys
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.core.config import settings
from backend.app.api import (
    auth, users, inspections, consumers, billing,
    issues, posts, notifications, predictions, feedback, models
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Operational decision-support platform for electricity theft detection, explainability, inspection prioritization, and feedback.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

from sqlalchemy import text
from backend.app.core.database import SessionLocal

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Human-readable exception handlers (Anti-raw-stack-trace rule)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join([str(x) for x in err.get("loc", []) if x != "body"])
        errors.append(f"{field}: {err.get('msg', 'Invalid input')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error: " + "; ".join(errors)}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Log internally without leaking stack traces to client
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact the system administrator."}
    )

# Comprehensive Health & Readiness Check
@app.get("/health")
@app.get("/api/health")
def health_and_readiness_check():
    """
    Enterprise health and readiness probe:
    1. Verifies server process is operational.
    2. Performs database ping (SELECT 1).
    3. Verifies active ML model artifact availability.
    """
    db_status = "connected"
    model_status = "ready"
    is_healthy = True

    # Check database
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1;"))
        db.close()
    except Exception:
        db_status = "unavailable"
        is_healthy = False

    # Check ML model artifact
    model_path = Path(__file__).resolve().parent.parent.parent / settings.MODEL_DIR / "xgboost_model.pkl"
    if not model_path.exists():
        model_status = "missing_artifact"
        is_healthy = False

    health_data = {
        "status": "healthy" if is_healthy else "degraded",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "active_model_version": settings.ACTIVE_MODEL_VERSION,
        "components": {
            "server": "operational",
            "database": db_status,
            "inference_model": model_status
        }
    }

    if not is_healthy:
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=health_data)

    return health_data

# API Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users & Onboarding"])
app.include_router(inspections.router, prefix="/api/inspections", tags=["Inspections & Flying Squad"])
app.include_router(consumers.router, prefix="/api/consumers", tags=["Consumers & Usage"])
app.include_router(billing.router, prefix="/api/billing", tags=["Billing & Invoicing"])
app.include_router(issues.router, prefix="/api/issues", tags=["Consumer Issues"])
app.include_router(posts.router, prefix="/api/posts", tags=["Board Communication"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["ML Predictions & Models"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["Human-in-the-Loop Feedback"])
app.include_router(models.router, prefix="/api/models", tags=["Model Governance & Lifecycle"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
