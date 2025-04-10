from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DB_NAME = os.getenv("DB_NAME")

print(f"Attempting to connect to MongoDB Atlas: {MONGODB_URL}")

try:
    client = MongoClient(
        MONGODB_URL,
        serverSelectionTimeoutMS=5000,
        tls=True,
        tlsAllowInvalidCertificates=False
    )
    client.admin.command("ping")
    print("Ping successful - Connected to MongoDB Atlas!")
    db = client[DB_NAME]
except ServerSelectionTimeoutError as e:
    print(f"Connection timeout: {str(e)}")
    raise
except Exception as e:
    print(f"Unexpected error: {str(e)}")
    raise
