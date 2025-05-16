from pydantic import ConfigDict
import uuid
from datetime import datetime
from typing import Optional, Dict, Any

# Common configuration for all models
model_config = ConfigDict(
    arbitrary_types_allowed=True,
    populate_by_name=True,
    json_schema_extra={
        "example": {}  # Empty example to be populated in the actual models
    }
)

def generate_uuid() -> str:
    """Generate a unique UUID string for use as ID"""
    return str(uuid.uuid4())

def generate_id_with_prefix(prefix: str) -> str:
    """Generate a unique ID with a prefix (e.g., 'AST-1234-5678')"""
    # Take the first 8 characters of a UUID
    uuid_part = str(uuid.uuid4()).replace('-', '')[:8].upper()
    return f"{prefix}-{uuid_part}"

def generate_asset_id() -> str:
    """Generate an asset ID with 'AST' prefix"""
    return generate_id_with_prefix("AST")

def generate_employee_id() -> str:
    """Generate an employee ID with 'EMP' prefix"""
    return generate_id_with_prefix("EMP")

def generate_category_id() -> str:
    """Generate a category ID with 'CAT' prefix"""
    return generate_id_with_prefix("CAT")

def generate_document_id() -> str:
    """Generate a document ID with 'DOC' prefix"""
    return generate_id_with_prefix("DOC")

def generate_maintenance_id() -> str:
    """Generate a maintenance ID with 'MNT' prefix"""
    return generate_id_with_prefix("MNT")

def generate_assignment_id() -> str:
    """Generate an assignment ID with 'ASG' prefix"""
    return generate_id_with_prefix("ASG")

def generate_request_id() -> str:
    """Generate a request ID with 'REQ' prefix"""
    return generate_id_with_prefix("REQ")

def get_current_datetime() -> datetime:
    """Get the current datetime for timestamps"""
    return datetime.utcnow()

def serialize_model(model) -> Dict[str, Any]:
    """
    Serialize a model to a dictionary, handling UUID and datetime objects
    This is a replacement for Pydantic's json_encoders in Config
    """
    if hasattr(model, "model_dump"):
        data = model.model_dump()
    else:
        data = dict(model)
    
    # Convert UUID objects to strings
    for key, value in data.items():
        if isinstance(value, uuid.UUID):
            data[key] = str(value)
        elif isinstance(value, datetime):
            data[key] = value.isoformat()
    return data 