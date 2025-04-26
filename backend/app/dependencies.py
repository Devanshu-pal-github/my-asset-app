from pymongo import MongoClient, ASCENDING
from pymongo.errors import ServerSelectionTimeoutError, DuplicateKeyError
from dotenv import load_dotenv
import os
import logging

# Configure logging for MongoDB connection and index creation
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()
mongodb_url = os.getenv("MONGODB_URL")
logger.debug(f"Attempting to connect to MongoDB Atlas: {mongodb_url}")

# Validate MongoDB URL
if not mongodb_url:
    logger.error("MONGODB_URL not found in environment variables")
    raise ValueError("MONGODB_URL not found in environment variables")

try:
    # Initialize MongoDB client with connection settings
    client = MongoClient(
        mongodb_url,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
        tls=True,
        tlsAllowInvalidCertificates=True
    )
    # Select the asset_management database
    db = client["asset_management"]
    # Test connection with a ping command
    ping_result = db.command("ping")
    logger.info(f"Ping successful - Connected to MongoDB Atlas! Result: {ping_result}")
    
    logger.debug("Checking and creating indexes...")
    # Ensure unique indexes for efficient queries and data integrity
    category_indexes = db.asset_categories.index_information()
    if "name_1" not in category_indexes or category_indexes["name_1"].get("unique") != True:
        if "name_1" in category_indexes:
            db.asset_categories.drop_index("name_1")
            logger.info("Dropped non-unique index name_1 on asset_categories")
        try:
            db.asset_categories.create_index([("name", ASCENDING)], unique=True, name="name_1")
            logger.info("Created unique index on asset_categories.name")
        except Exception as e:
            logger.error(f"Failed to create unique index on asset_categories.name: {str(e)}")
            raise

    db.asset_items.create_index([("asset_tag", ASCENDING)], unique=True)
    db.employees.create_index([("employee_id", ASCENDING), ("email", ASCENDING)], unique=True)
    db.asset_items.create_index([("category_id", ASCENDING)])
    db.documents.create_index([("asset_id", ASCENDING), ("employee_id", ASCENDING)])
    logger.info("Indexes created successfully")

except ServerSelectionTimeoutError as e:
    logger.error(f"Connection timeout: {str(e)}")
    raise
except Exception as e:
    logger.error(f"Unexpected error: {str(e)}")
    raise

# Dependency to provide MongoDB database instance to routers
def get_db():
    """
    Yields the MongoDB database instance for use in FastAPI routes.
    """
    try:
        yield db
    finally:
        logger.debug("Database connection yielded")