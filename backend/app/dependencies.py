from pymongo import MongoClient, ASCENDING
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import ServerSelectionTimeoutError
from fastapi import Depends, HTTPException, status
from dotenv import load_dotenv
import os
import logging

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
mongodb_url = os.getenv("MONGODB_URL")

if not mongodb_url:
    logger.error("MONGODB_URL not found in environment variables")
    raise ValueError("MONGODB_URL not found in environment variables")

# Initialize MongoDB client
client = MongoClient(
    mongodb_url,
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=30000,
    socketTimeoutMS=30000,
    tls=True,
    tlsAllowInvalidCertificates=True
)

# Select the database
db: Database = client["asset_management"]

# Fix the unique index on asset_categories
logger.debug("Checking and creating indexes for asset_categories...")
category_indexes = db.asset_categories.index_information()
if "name_1" in category_indexes:
    db.asset_categories.drop_index("name_1")
    logger.info("Dropped incorrect unique index name_1 on asset_categories")
if "category_name_1" not in category_indexes:
    db.asset_categories.create_index([("category_name", ASCENDING)], unique=True, name="category_name_1")
    logger.info("Created unique index on asset_categories.category_name")

# Create UUID-based indexes for all collections
db.asset_categories.create_index([("id", ASCENDING)], unique=True)
db.asset_items.create_index([("id", ASCENDING)], unique=True)
db.asset_items.create_index([("asset_tag", ASCENDING)], unique=True)
db.asset_items.create_index([("serial_number", ASCENDING)], sparse=True)
db.asset_items.create_index([("category_id", ASCENDING)])
db.asset_items.create_index([("department", ASCENDING)])
db.asset_items.create_index([("location", ASCENDING)])
db.asset_items.create_index([("maintenance_due_date", ASCENDING)])

db.employees.create_index([("id", ASCENDING)], unique=True)
db.employees.create_index([("employee_id", ASCENDING)], unique=True)
db.employees.create_index([("contact.email", ASCENDING)], unique=True)

db.documents.create_index([("id", ASCENDING)], unique=True)
db.documents.create_index([("asset_id", ASCENDING)])
db.documents.create_index([("employee_id", ASCENDING)])

db.assignment_history.create_index([("id", ASCENDING)], unique=True)
db.assignment_history.create_index([("asset_id", ASCENDING)])
db.assignment_history.create_index([("assigned_to", ASCENDING)])
db.assignment_history.create_index([("is_active", ASCENDING)])

db.maintenance_history.create_index([("id", ASCENDING)], unique=True)
db.maintenance_history.create_index([("asset_id", ASCENDING)])
db.maintenance_history.create_index([("status", ASCENDING)])

db.requests.create_index([("id", ASCENDING)], unique=True)
db.requests.create_index([("type", ASCENDING)])
db.requests.create_index([("status", ASCENDING)])
db.requests.create_index([("created_at", ASCENDING)])

logger.info("All indexes created successfully")

def get_db() -> Database:
    """
    Yields the MongoDB database instance for use in FastAPI routes.
    """
    try:
        yield db
    finally:
        logger.debug("Database connection yielded")

def get_asset_categories_collection(db: Database = Depends(get_db)) -> Collection:
    """
    Provides the asset_categories collection.
    """
    return db["asset_categories"]

def get_asset_items_collection(db: Database = Depends(get_db)) -> Collection:
    """
    Provides the asset_items collection.
    """
    return db["asset_items"]

def get_employees_collection(db: Database = Depends(get_db)) -> Collection:
    return db["employees"]

def get_documents_collection(db: Database = Depends(get_db)) -> Collection:
    return db["documents"]

def get_assignment_history_collection(db: Database = Depends(get_db)) -> Collection:
    return db["assignment_history"]

def get_maintenance_history_collection(db: Database = Depends(get_db)) -> Collection:
    return db["maintenance_history"]

def get_requests_collection(db: Database = Depends(get_db)) -> Collection:
    return db["requests"]