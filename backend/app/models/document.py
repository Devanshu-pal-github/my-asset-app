from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class DocumentEntry(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique document ID")
    asset_id: Optional[str] = Field(None, description="Associated asset ID")
    employee_id: Optional[str] = Field(None, description="Associated employee ID")
    document_type: str = Field(..., description="Type of document, e.g., 'Warranty', 'Image'")
    file_url: str = Field(..., description="URL to the document file")
    file_size: Optional[int] = Field(None, description="Size of the file in bytes")
    expiry_date: Optional[datetime] = Field(None, description="Document expiry date, if applicable")
    notes: Optional[str] = Field(None, description="Additional notes")
    uploaded_by: str = Field(..., description="ID of the employee who uploaded the document")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class DocumentCreate(BaseModel):
    asset_id: Optional[str] = None
    employee_id: Optional[str] = None
    document_type: str
    file_url: str
    file_size: Optional[int] = None
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None
    uploaded_by: str

    class Config:
        arbitrary_types_allowed = True