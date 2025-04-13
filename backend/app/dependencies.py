from pymongo import MongoClient, ASCENDING
from pymongo.errors import ServerSelectionTimeoutError
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
mongodb_url = os.getenv("MONGODB_URL")
print(f"Attempting to connect to MongoDB Atlas: {mongodb_url}")

if not mongodb_url:
    raise ValueError("MONGODB_URL not found in environment variables")

try:
    # Create MongoClient with TLS settings
    client = MongoClient(
        mongodb_url,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
        tls=True,
        tlsAllowInvalidCertificates=True  # Must be True to bypass certificate validation
    )
    
    # Test the connection
    ping_result = client.admin.command("ping")
    print(f"Ping successful - Connected to MongoDB Atlas! Result: {ping_result}")
    db = client["asset_management"]
    
    # Create indexes
    print("Creating indexes...")
    db.asset_items.create_index([("asset_tag", ASCENDING)], unique=True)
    db.employees.create_index([("employee_id", ASCENDING)], unique=True)
    db.asset_items.create_index([("category_id", ASCENDING)])
    db.assignment_history.create_index([("asset_id", ASCENDING)])
    print("Indexes created successfully")

except ServerSelectionTimeoutError as e:
    print(f"Connection timeout: {str(e)}")
    raise
except Exception as e:
    print(f"Unexpected error: {str(e)}")
    raise