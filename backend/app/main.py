from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.dependencies import db
from app.routers import asset_categories, asset_items  # Add asset_items
import logging
import logging.handlers

# Configure logging with StreamHandler for terminal output
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
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
logger.info("CORS middleware configured with origins: http://localhost:5173")

# Include routers with debug logging
logger.debug("Registering asset_categories router with prefix /api/v1")
app.include_router(asset_categories.router, prefix="/api/v1")
logger.debug("Registering asset_items router with prefix /api/v1")
app.include_router(asset_items.router, prefix="/api/v1")  # Add this line

# ... rest of the code remains unchanged ...

@app.on_event("startup")
async def startup_event():
    logger.info("Application is starting up...")
    try:
        db.command("ping")
        logger.info("MongoDB connection verified during startup")
        db.asset_categories.create_index("name")
        logger.info("Indexes ensured for asset_categories")
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
        logger.error(f"Health check failed: {str(e)}")
        return {"status": "unhealthy", "error": str(e)}

@app.get("/test")
async def test_endpoint():
    logger.info("Test endpoint hit")
    return {"message": "Server is responding"}

@app.middleware("http")
async def log_requests(request, call_next):
    logger.debug(f"Received request: {request.method} {request.url}")
    response = await call_next(request)
    logger.debug(f"Completed request: {request.method} {request.url} - Status: {response.status_code}")
    return response