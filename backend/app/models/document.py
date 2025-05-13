from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from enum import Enum

class DocumentType(str, Enum):
    WARRANTY = "Warranty"
    INVOICE = "Invoice"
    PURCHASE_ORDER = "Purchase Order"
    INSURANCE = "Insurance"
    MANUAL = "Manual"
    IMAGE = "Image"
    CONTRACT = "Contract"
    LICENSE = "License"
    CERTIFICATE = "Certificate"
    OTHER = "Other"

class DocumentStatus(str, Enum):
    ACTIVE = "Active"
    EXPIRED = "Expired"
    PENDING = "Pending"
    REJECTED = "Rejected"
    ARCHIVED = "Archived"

class DocumentEntry(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique document ID")
    asset_id: Optional[str] = Field(None, description="Associated asset ID")
    asset_name: Optional[str] = Field(None, description="Name of the associated asset")
    asset_tag: Optional[str] = Field(None, description="Tag of the associated asset")
    category_id: Optional[str] = Field(None, description="Category ID of the associated asset")
    category_name: Optional[str] = Field(None, description="Name of the associated category")
    employee_id: Optional[str] = Field(None, description="Associated employee ID")
    employee_name: Optional[str] = Field(None, description="Name of the associated employee")
    document_type: DocumentType = Field(..., description="Type of document")
    document_title: Optional[str] = Field(None, description="Title of the document")
    file_url: str = Field(..., description="URL to the document file")
    file_name: Optional[str] = Field(None, description="Original file name")
    file_size: Optional[int] = Field(None, description="Size of the file in bytes")
    file_type: Optional[str] = Field(None, description="MIME type of the file")
    issue_date: Optional[datetime] = Field(None, description="Date the document was issued")
    expiry_date: Optional[datetime] = Field(None, description="Document expiry date, if applicable")
    status: DocumentStatus = Field(DocumentStatus.ACTIVE, description="Current status of the document")
    is_required: bool = Field(False, description="Whether the document is required")
    is_verified: bool = Field(False, description="Whether the document has been verified")
    verified_by: Optional[str] = Field(None, description="ID of employee who verified the document")
    verified_by_name: Optional[str] = Field(None, description="Name of employee who verified the document")
    verification_date: Optional[datetime] = Field(None, description="Date the document was verified")
    tags: List[str] = Field(default_factory=list, description="Tags associated with the document")
    notes: Optional[str] = Field(None, description="Additional notes")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata for the document")
    uploaded_by: str = Field(..., description="ID of the employee who uploaded the document")
    uploaded_by_name: Optional[str] = Field(None, description="Name of the employee who uploaded the document")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        populate_by_name = True

class DocumentCreate(BaseModel):
    asset_id: Optional[str] = None
    asset_name: Optional[str] = None
    category_id: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    document_type: DocumentType
    document_title: Optional[str] = None
    file_url: str
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    status: DocumentStatus = DocumentStatus.ACTIVE
    is_required: bool = False
    is_verified: bool = False
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    uploaded_by: str

    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True

class DocumentUpdate(BaseModel):
    document_type: Optional[DocumentType] = None
    document_title: Optional[str] = None
    expiry_date: Optional[datetime] = None
    status: Optional[DocumentStatus] = None
    is_required: Optional[bool] = None
    is_verified: Optional[bool] = None
    verified_by: Optional[str] = None
    verification_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True