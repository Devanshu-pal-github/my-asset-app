
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
from pymongo import ASCENDING
from starlette.responses import JSONResponse

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

app = FastAPI(title="Asset Management API", version="1.0.0")

# Enhanced CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Access-Control-Allow-Origin"],
)
logger.info("CORS middleware configured with origins: http://localhost:5173, http://127.0.0.1:5173, http://localhost:3000, *")

# Log all requests, including preflight
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.debug(f"Received request: {request.method} {request.url} from {request.client.host} headers: {request.headers}")
    try:
        response = await call_next(request)
        logger.debug(f"Completed request: {request.method} {request.url} - Status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {request.method} {request.url} - Error: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(e)}"}
        )

# Register routers
logger.debug("Registering routers with prefix /api/v1")
app.include_router(asset_categories.router, prefix="/api/v1")
app.include_router(asset_items.router, prefix="/api/v1")
app.include_router(assignment_history.router, prefix="/api/v1")
app.include_router(maintenance_history.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(employees.router, prefix="/api/v1")

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Application is starting up...")
    try:
        db.command("ping")
        logger.info("MongoDB connection verified during startup")
        
        # Ensure indexes
        category_indexes = db.asset_categories.index_information()
        if "name_1" not in category_indexes or category_indexes["name_1"].get("unique") != True:
            if "name_1" in category_indexes:
                db.asset_categories.drop_index("name_1")
                logger.info("Dropped non-unique index name_1 on asset_categories")
            db.asset_categories.create_index([("name", ASCENDING)], unique=True)
            logger.info("Created unique index on asset_categories.name")

        asset_indexes = db.asset_items.index_information()
        if "asset_tag_text_category_id_1" not in asset_indexes:
            db.asset_items.create_index([("asset_tag", "text"), ("category_id", ASCENDING)])
            logger.info("Created text index on asset_items.asset_tag and category_id")

        db.employees.create_index([("employee_id", ASCENDING), ("email", ASCENDING)], unique=True)
        db.documents.create_index([("asset_id", ASCENDING), ("employee_id", ASCENDING)])
        
        logger.info("Indexes ensured for all collections")
        
        collections = db.list_collection_names()
        required_collections = ["asset_categories", "asset_items", "employees", "documents"]
        for coll in required_collections:
            if coll not in collections:
                db.create_collection(coll)
                logger.info(f"Created collection: {coll}")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {str(e)}", exc_info=True)
        raise

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application is shutting down...")

# Root endpoint
@app.get("/")
def read_root():
    logger.info("Root endpoint hit")
    try:
        db.command("ping")
        logger.info("MongoDB connection test successful")
        return {"message": "Connected to MongoDB Atlas successfully!", "version": "1.0.0"}
    except Exception as e:
        logger.error(f"MongoDB connection test failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"MongoDB connection failed: {str(e)}")

# Health check
@app.get("/health")
async def health_check():
    logger.info("Health check endpoint hit")
    try:
        db.command("ping")
        stats = {
            "status": "healthy",
            "mongodb": "connected",
            "collections": {
                "asset_categories": db.asset_categories.count_documents({}),
                "asset_items": db.asset_items.count_documents({}),
                "employees": db.employees.count_documents({}),
                "documents": db.documents.count_documents({})
            }
        }
        logger.info(f"MongoDB health check: {stats['collections']}")
        return stats
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        return {"status": "unhealthy", "error": str(e)}

# Debug endpoint
@app.get("/debug-request")
async def debug_request(request: Request):
    logger.info(f"Debug request received: {request.method} {request.url} from {request.client.host}")
    return {
        "message": "Request received",
        "method": request.method,
        "url": str(request.url),
        "client": request.client.host
    }
