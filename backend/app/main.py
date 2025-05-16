from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from app.dependencies import db, get_db, safe_create_index
from app.routers import (
    asset_categories_router,
    asset_items_router,
    assignment_history_router,
    maintenance_history_router,
    documents_router,
    employees_router,
    request_approval_router
)
from app.api.v1 import analytics
import logging
import logging.handlers
from pymongo.database import Database
from starlette.responses import JSONResponse
from enum import Enum
from typing import Any
from pymongo import ASCENDING, TEXT

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

app = FastAPI(title="Asset Management API", version="1.0.0")

# Custom JSON encoder for enums
class EnumJsonEncoder:
    @staticmethod
    def encode(obj: Any) -> Any:
        if isinstance(obj, Enum):
            return obj.value
        return obj

# Custom response class to handle enums
class CustomJSONResponse(JSONResponse):
    def render(self, content: Any) -> bytes:
        # Process any enum values before encoding
        def process_enums(data):
            if isinstance(data, dict):
                return {k: process_enums(v) for k, v in data.items()}
            elif isinstance(data, list):
                return [process_enums(item) for item in data]
            elif isinstance(data, Enum):
                return data.value
            return data
        
        processed_content = process_enums(content)
        return super().render(processed_content)

# Override the default JSONResponse
app.router.default_response_class = CustomJSONResponse

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
app.include_router(asset_categories_router, prefix="/api/v1")
app.include_router(asset_items_router, prefix="/api/v1")
app.include_router(assignment_history_router, prefix="/api/v1")
app.include_router(maintenance_history_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(employees_router, prefix="/api/v1")
app.include_router(request_approval_router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Application is starting up...")
    try:
        db.command("ping")
        logger.info("MongoDB connection verified during startup")
        
        # Ensure text index on asset_items for search capabilities
        try:
            # We use the safe_create_index function with a named index to avoid conflicts
            text_index = [
                ("name", TEXT), 
                ("asset_tag", TEXT), 
                ("serial_number", TEXT),
                ("model", TEXT),
                ("manufacturer", TEXT)
            ]
            safe_create_index(db.asset_items, text_index, name="text_search_index")
            logger.info("Created/verified text search index on asset_items")
        except Exception as e:
            logger.warning(f"Error creating text index: {str(e)}")
        
        # Ensure all required collections exist
        collections = db.list_collection_names()
        required_collections = [
            "asset_categories", 
            "asset_items", 
            "employees", 
            "documents", 
            "assignment_history", 
            "maintenance_history",
            "requests"
        ]
        
        for coll in required_collections:
            if coll not in collections:
                db.create_collection(coll)
                logger.info(f"Created collection: {coll}")
                
        # Verify indexes for UUID-based fields for all collections
        # Note: The main creation is handled in dependencies.py, this is just a verification
        for coll in required_collections:
            if coll in collections:
                try:
                    index_info = db[coll].index_information()
                    if "id_1" not in index_info:
                        logger.warning(f"Collection {coll} missing id index - will be created by dependencies.py")
                except Exception as e:
                    logger.error(f"Error checking indexes for {coll}: {str(e)}")
                    
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
        collections = db.list_collection_names()
        stats = {
            "status": "healthy",
            "mongodb": "connected",
            "collections": {}
        }
        
        # Get counts for all collections
        for coll in collections:
            stats["collections"][coll] = db[coll].count_documents({})
        
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

# Temporary endpoint to clear asset_categories collection
@app.delete("/debug/clear-asset-categories")
async def clear_asset_categories(db: Database = Depends(get_db)):
    logger.info("Clearing asset_categories collection")
    try:
        result = db.asset_categories.delete_many({})
        logger.info(f"Deleted {result.deleted_count} documents from asset_categories")
        return {"message": f"Deleted {result.deleted_count} documents from asset_categories"}
    except Exception as e:
        logger.error(f"Failed to clear asset_categories: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to clear asset_categories: {str(e)}")