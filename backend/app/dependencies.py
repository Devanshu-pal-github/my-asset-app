from pymongo import MongoClient, ASCENDING
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import ServerSelectionTimeoutError, OperationFailure
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

# Helper function to safely create indexes
def safe_create_index(collection, keys, **kwargs):
    """Create an index safely, dropping existing ones if different options are needed"""
    index_name = kwargs.get('name')
    if not index_name:
        # Generate index name like MongoDB would (e.g. "field_1")
        index_name = '_'.join(f"{key[0]}_{key[1]}" for key in keys)
        if index_name.endswith('_1'):
            # Add name to kwargs for future reference
            kwargs['name'] = index_name
    
    try:
        # Check if index already exists
        index_info = collection.index_information()
        if index_name in index_info:
            # For simple comparison, just drop and recreate if options are provided
            if kwargs:
                logger.info(f"Dropping existing index {index_name} to recreate with new options")
                collection.drop_index(index_name)
                collection.create_index(keys, **kwargs)
                logger.info(f"Recreated index {index_name}")
            else:
                logger.info(f"Index {index_name} already exists, skipping")
        else:
            # Create new index
            collection.create_index(keys, **kwargs)
            logger.info(f"Created new index {index_name}")
    except OperationFailure as e:
        logger.error(f"Error working with index {index_name}: {str(e)}")
        # If it's not a critical error, continue
        if "already exists" not in str(e) and "duplicate" not in str(e):
            raise

# Fix the unique index on asset_categories
logger.info("Checking and creating indexes for asset_categories...")
try:
    category_indexes = db.asset_categories.index_information()
    if "name_1" in category_indexes:
        db.asset_categories.drop_index("name_1")
        logger.info("Dropped incorrect unique index name_1 on asset_categories")
    if "category_name_1" not in category_indexes:
        db.asset_categories.create_index([("category_name", ASCENDING)], unique=True, name="category_name_1")
        logger.info("Created unique index on asset_categories.category_name")
except Exception as e:
    logger.error(f"Error fixing asset_categories index: {str(e)}")

# Create UUID-based indexes for all collections - log only once at startup
logger.info("Creating/verifying indexes for all collections")
safe_create_index(db.asset_categories, [("id", ASCENDING)], unique=True)
safe_create_index(db.asset_items, [("id", ASCENDING)], unique=True)
safe_create_index(db.asset_items, [("asset_tag", ASCENDING)], unique=True)
safe_create_index(db.asset_items, [("serial_number", ASCENDING)], unique=True, sparse=True)
safe_create_index(db.asset_items, [("category_id", ASCENDING)])
safe_create_index(db.asset_items, [("department", ASCENDING)])
safe_create_index(db.asset_items, [("location", ASCENDING)])
safe_create_index(db.asset_items, [("maintenance_due_date", ASCENDING)])

safe_create_index(db.employees, [("id", ASCENDING)], unique=True)
safe_create_index(db.employees, [("employee_id", ASCENDING)], unique=True)
safe_create_index(db.employees, [("contact.email", ASCENDING)], unique=True)

safe_create_index(db.documents, [("id", ASCENDING)], unique=True)
safe_create_index(db.documents, [("asset_id", ASCENDING)])
safe_create_index(db.documents, [("employee_id", ASCENDING)])

safe_create_index(db.assignment_history, [("id", ASCENDING)], unique=True)
safe_create_index(db.assignment_history, [("asset_id", ASCENDING)])
safe_create_index(db.assignment_history, [("assigned_to", ASCENDING)])
safe_create_index(db.assignment_history, [("is_active", ASCENDING)])

safe_create_index(db.maintenance_history, [("id", ASCENDING)], unique=True)
safe_create_index(db.maintenance_history, [("asset_id", ASCENDING)])
safe_create_index(db.maintenance_history, [("status", ASCENDING)])

safe_create_index(db.requests, [("id", ASCENDING)], unique=True)
safe_create_index(db.requests, [("type", ASCENDING)])
safe_create_index(db.requests, [("status", ASCENDING)])
safe_create_index(db.requests, [("created_at", ASCENDING)])

logger.info("All indexes created successfully")

# Function to get the database - supports both sync and async contexts
def get_db():
    """
    Get the MongoDB database instance.
    
    Can be used in both sync and async contexts.
    """
    return db

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