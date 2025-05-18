from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
from .utils import (
    model_config,
    generate_document_id,
    get_current_datetime
)

# Document Type Enum - lowercase to match frontend
class DocumentType(str, Enum):
    INVOICE = "invoice"
    WARRANTY = "warranty"
    PURCHASE_ORDER = "purchase_order"
    INSURANCE = "insurance"
    MANUAL = "manual"
    CERTIFICATE = "certificate"
    CONTRACT = "contract"
    LICENSE = "license"
    COMPLIANCE = "compliance"
    OTHER = "other"

# Document Status Enum - lowercase to match frontend
class DocumentStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    PENDING = "pending"
    INVALID = "invalid"
    DRAFT = "draft"
    ARCHIVED = "archived"

# Document Approval Status
class ApprovalStatus(str, Enum):
    APPROVED = "approved"
    PENDING = "pending"
    REJECTED = "rejected"
    WAITING = "waiting"
    NOT_REQUIRED = "not_required"

# Document Schema with all frontend fields
class Document(BaseModel):
    id: str = Field(default_factory=generate_document_id, description="Unique document ID")
    
    # Basic Information
    name: str = Field(..., description="Document name")
    description: Optional[str] = Field(None, description="Document description")
    document_type: DocumentType = Field(..., description="Type of document")
    status: DocumentStatus = Field(default=DocumentStatus.ACTIVE, description="Document status")
    
    # File Information
    file_name: str = Field(..., description="Original file name")
    file_type: Optional[str] = Field(None, description="File type, e.g., 'pdf', 'docx'")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    file_url: str = Field(..., description="URL to access the file")
    thumbnail_url: Optional[str] = Field(None, description="URL to thumbnail, if available")
    
    # Association Information
    asset_id: Optional[str] = Field(None, description="Asset ID this document is associated with")
    asset_name: Optional[str] = Field(None, description="Asset name for reference")
    asset_tag: Optional[str] = Field(None, description="Asset tag for reference")
    category_id: Optional[str] = Field(None, description="Category ID this document is associated with")
    category_name: Optional[str] = Field(None, description="Category name for reference")
    employee_id: Optional[str] = Field(None, description="Employee ID this document is associated with")
    employee_name: Optional[str] = Field(None, description="Employee name for reference")
    
    # Dates
    created_at: datetime = Field(default_factory=get_current_datetime, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    upload_date: str = Field(..., description="Date of upload in YYYY-MM-DD format")
    issue_date: Optional[str] = Field(None, description="Date of issue in YYYY-MM-DD format")
    expiry_date: Optional[str] = Field(None, description="Expiration date in YYYY-MM-DD format")
    
    # Additional Information
    tags: List[str] = Field(default_factory=list, description="Tags associated with the document")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    notes: Optional[str] = Field(None, description="Additional notes")
    
    # Approval and Workflow
    approval_status: ApprovalStatus = Field(default=ApprovalStatus.NOT_REQUIRED, description="Approval status")
    approval_date: Optional[str] = Field(None, description="Date of approval")
    approved_by: Optional[str] = Field(None, description="Person who approved the document")
    uploaded_by: Optional[str] = Field(None, description="Person who uploaded the document")
    uploaded_by_name: Optional[str] = Field(None, description="Name of person who uploaded the document")
    
    # Additional fields from frontend
    document_id: Optional[str] = Field(None, description="Alternative document identifier")
    document_number: Optional[str] = Field(None, description="Document number (e.g., invoice number)")
    version: Optional[str] = Field(None, description="Document version")
    is_confidential: Optional[bool] = Field(False, description="Whether the document is confidential")
    access_level: Optional[str] = Field(None, description="Access level for the document")
    related_documents: List[str] = Field(default_factory=list, description="IDs of related documents")
    
    # Fields from DocumentList in index.jsx
    doc_id: Optional[str] = Field(None, description="Document ID used in frontend")
    docType: Optional[str] = Field(None, description="Document type in camelCase")
    assignedTo: Optional[str] = Field(None, description="Assigned to in camelCase")
    downloadUrl: Optional[str] = Field(None, description="Download URL in camelCase")
    isExpired: Optional[bool] = Field(False, description="Whether the document is expired")
    daysUntilExpiry: Optional[int] = Field(None, description="Days until document expiry")
    
    model_config = model_config
    
    # Add post-initialization logic to extract file type if not provided
    def model_post_init(self, __context):
        if not self.file_type and self.file_name and '.' in self.file_name:
            # Extract file type from file name if not provided
            self.file_type = self.file_name.split('.')[-1].lower()

# For document creation
class DocumentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    document_type: DocumentType
    status: DocumentStatus = DocumentStatus.ACTIVE
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    file_url: str
    thumbnail_url: Optional[str] = None
    asset_id: Optional[str] = None
    asset_name: Optional[str] = None
    asset_tag: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    upload_date: str
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None
    approval_status: ApprovalStatus = ApprovalStatus.NOT_REQUIRED
    uploaded_by: Optional[str] = None
    uploaded_by_name: Optional[str] = None
    document_number: Optional[str] = None
    is_confidential: Optional[bool] = False
    doc_id: Optional[str] = None
    docType: Optional[str] = None
    downloadUrl: Optional[str] = None
    
    model_config = model_config
    
    # Add validation to auto-set file_type if not provided
    def model_post_init(self, __context):
        if not self.file_type and self.file_name and '.' in self.file_name:
            # Extract file type from file name if not provided
            self.file_type = self.file_name.split('.')[-1].lower()

# For document updates
class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    document_type: Optional[DocumentType] = None
    status: Optional[DocumentStatus] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    asset_id: Optional[str] = None
    asset_name: Optional[str] = None
    asset_tag: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    upload_date: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    approval_status: Optional[ApprovalStatus] = None
    approval_date: Optional[str] = None
    approved_by: Optional[str] = None
    document_id: Optional[str] = None
    document_number: Optional[str] = None
    version: Optional[str] = None
    is_confidential: Optional[bool] = None
    access_level: Optional[str] = None
    related_documents: Optional[List[str]] = None
    doc_id: Optional[str] = None
    docType: Optional[str] = None
    assignedTo: Optional[str] = None
    downloadUrl: Optional[str] = None
    isExpired: Optional[bool] = None
    daysUntilExpiry: Optional[int] = None
    
    model_config = model_config

# For document response in list views
class DocumentResponse(BaseModel):
    id: str
    name: str
    document_type: str
    status: str
    file_name: str
    file_type: Optional[str] = None
    file_url: str
    upload_date: str
    expiry_date: Optional[str] = None
    asset_name: Optional[str] = None
    asset_tag: Optional[str] = None
    employee_name: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    is_confidential: Optional[bool] = None
    doc_id: Optional[str] = None
    docType: Optional[str] = None
    downloadUrl: Optional[str] = None
    file_size: Optional[int] = None
    created_at: Optional[datetime] = None
    
    model_config = model_config