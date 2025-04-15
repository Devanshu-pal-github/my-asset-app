from pymongo import MongoClient, ASCENDING
from pymongo.errors import ServerSelectionTimeoutError
from dotenv import load_dotenv
import os
import logging

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
mongodb_url = os.getenv("MONGODB_URL")
logger.debug(f"Attempting to connect to MongoDB Atlas: {mongodb_url}")

if not mongodb_url:
    logger.error("MONGODB_URL not found in environment variables")
    raise ValueError("MONGODB_URL not found in environment variables")

try:
    client = MongoClient(
        mongodb_url,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
        tls=True,
        tlsAllowInvalidCertificates=True
    )
    db = client["asset_management"]
    ping_result = db.command("ping")
    logger.info(f"Ping successful - Connected to MongoDB Atlas! Result: {ping_result}")
    
    logger.debug("Creating indexes...")
    db.asset_items.create_index([("asset_tag", ASCENDING)], unique=True)
    db.employees.create_index([("employee_id", ASCENDING)], unique=True)
    db.asset_items.create_index([("category_id", ASCENDING)])
    db.assignment_history.create_index([("asset_id", ASCENDING)])
    logger.info("Indexes created successfully")

except ServerSelectionTimeoutError as e:
    logger.error(f"Connection timeout: {str(e)}")
    raise
except Exception as e:
    logger.error(f"Unexpected error: {str(e)}")
    raise