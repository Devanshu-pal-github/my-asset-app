from fastapi import FastAPI
from app.dependencies import db
from app.routers import (
    asset_categories,
    asset_items,
    assignment_history,
    maintenance_history,
    documents,
    employees,
)
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Asset Management API")

app.include_router(asset_categories.router, prefix="/api/v1")
app.include_router(asset_items.router, prefix="/api/v1")
app.include_router(assignment_history.router, prefix="/api/v1")
app.include_router(maintenance_history.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(employees.router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    logger.info("Application is starting up...")
    try:
        db.command("ping")  # Reliable connection test
        logger.info("MongoDB connection verified during startup")
        logger.info("Indexes ensured for asset_items, employees, assignment_history")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application is shutting down...")

@app.get("/")
def read_root():
    logger.info("Root endpoint hit")
    try:
        db.command("ping")
        logger.info("MongoDB connection test successful")
        return {"message": "Connected to MongoDB Atlas successfully!"}
    except Exception as e:
        logger.error(f"MongoDB connection test failed: {str(e)}")
        raise

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"Received request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Completed request: {request.method} {request.url} - Status: {response.status_code}")
    return response