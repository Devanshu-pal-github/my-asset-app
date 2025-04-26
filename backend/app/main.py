from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
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
import logging.handlers
from starlette.responses import JSONResponse

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

app = FastAPI(title="Asset Management API")

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
logger.info("CORS middleware configured with origins: http://localhost:5173, http://127.0.0.1:5173")

# Include routers
logger.debug("Registering routers with prefix /api/v1")
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
        db.command("ping")
        logger.info("MongoDB connection verified during startup")
        db.asset_categories.create_index("name")
        logger.info("Indexes ensured for asset_categories")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {str(e)}", exc_info=True)
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
        logger.error(f"MongoDB connection test failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"MongoDB connection failed: {str(e)}")

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint hit")
    try:
        db.command("ping")
        category_count = db.asset_categories.count_documents({})
        logger.info(f"MongoDB health check: {category_count} categories found")
        return {
            "status": "healthy",
            "mongodb": "connected",
            "asset_categories_count": category_count
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        return {"status": "unhealthy", "error": str(e)}

@app.get("/debug-request")
async def debug_request(request: Request):
    logger.info(f"Debug request received: {request.method} {request.url} from {request.client.host}")
    return {
        "message": "Request received",
        "method": request.method,
        "url": str(request.url),
        "client": request.client.host
    }

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.debug(f"Received request: {request.method} {request.url} from {request.client.host}")
    try:
        response = await call_next(request)
        logger.debug(f"Completed request: {request.method} {request.url} - Status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {request.method} {request.url} - Error: {str(e)}", exc_info=True)
        raise