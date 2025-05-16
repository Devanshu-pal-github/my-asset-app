from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pymongo.database import Database
from app.dependencies import db, get_db, safe_create_index
from app.routers import (
    asset_categories, 
    asset_items, 
    employees, 
    documents, 
    assignment_history, 
    maintenance_history, 
    request_approval
)
from typing import Any
from enum import Enum
from pymongo import ASCENDING, TEXT
from app.logging_config import setup_logging, get_logger
import pymongo
from bson.son import SON
import uvicorn
import logging

# Temporarily comment out analytics router
# from app.api.v1 import router as analytics_router

# Configure logging using our custom configuration
setup_logging(
    log_level="INFO",
    log_file="app.log",
    console_log_level="INFO",
    file_log_level="DEBUG"
)
logger = get_logger("app.main")

app = FastAPI(
    title="Asset Management API",
    description="API for Asset Management System",
    version="1.0.0"
)

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
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
        "http://localhost:3000",  # Create React App dev server
        "http://127.0.0.1:3000",
        "http://localhost:8000",  # Same-origin requests
        "http://127.0.0.1:8000",
        "http://localhost",       # Production deployments
        "http://127.0.0.1"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Access-Control-Allow-Origin"],
)
logger.info("CORS middleware configured with frontend origins")

# Log only non-OPTIONS requests (reduce preflight log spam)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Only log non-OPTIONS requests and only at INFO level
    if request.method != "OPTIONS":
        logger.info(f"Request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        # Log non-OPTIONS responses only if they have error status codes
        if request.method != "OPTIONS" and response.status_code >= 400:
            logger.warning(f"Request failed: {request.method} {request.url.path} - Status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Request failed: {request.method} {request.url.path} - Error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(e)}"}
        )

# Register routers
logger.info("Registering routers with prefix /api")
app.include_router(asset_categories, prefix="/api/asset-categories", tags=["Asset Categories"])
app.include_router(asset_items, prefix="/api/asset-items", tags=["Asset Items"])
app.include_router(employees, prefix="/api/employees", tags=["Employees"])
app.include_router(documents, prefix="/api/documents", tags=["Documents"])
app.include_router(assignment_history, prefix="/api/assignment-history", tags=["Assignment History"])
app.include_router(maintenance_history, prefix="/api/maintenance-history", tags=["Maintenance History"])
app.include_router(request_approval, prefix="/api/request-approval", tags=["Request Approval"])
# Temporarily comment out analytics router
# app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Asset Management API application on port 8000...")
    
    # Verify MongoDB connection and setup indexes
    db = get_db()
    logger.info("MongoDB connection verified successfully")
    
    # Create collections if they don't exist
    collections = db.list_collection_names()
    
    required_collections = [
        "asset_categories", "asset_items", "employees", 
        "documents", "assignment_history", "maintenance_history", 
        "request_approval"
    ]
    
    for collection in required_collections:
        if collection not in collections:
            logger.info(f"Creating collection: {collection}")
            db.create_collection(collection)

    # Check if text index already exists before creating it
    asset_items_collection = db.get_collection("asset_items")
    existing_indexes = asset_items_collection.index_information()
    
    # Check for text index
    text_index_exists = False
    text_index_name = None
    
    for idx_name, idx_info in existing_indexes.items():
        if any('text' in field for field in idx_info.get('key', [])):
            text_index_exists = True
            text_index_name = idx_name
            break
    
    if text_index_exists:
        logger.info(f"Using existing text index: {text_index_name}")
    else:
        logger.info("Creating text index on asset_items.asset_tag field")
        asset_items_collection.create_index([("asset_tag", pymongo.TEXT)], name="asset_tag_text")
    
    # Ensure we have proper indexes for UUID fields
    for collection_name in ["asset_categories", "asset_items", "employees", "documents"]:
        collection = db[collection_name]
        collection.create_index([("id", pymongo.ASCENDING)], unique=True)
    
    logger.info("All database indexes verified")
    logger.info("Server started successfully!")
    logger.info("API documentation available at: http://localhost:8000/docs")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("========== APPLICATION SHUTTING DOWN ==========")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to Asset Management API"}

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

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)