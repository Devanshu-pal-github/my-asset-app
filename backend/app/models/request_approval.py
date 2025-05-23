from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime
from .utils import (
    model_config,
    generate_request_id,
    generate_uuid,
    get_current_datetime
)

# Request Types Enum - lowercase to match frontend
class RequestType(str, Enum):
    ASSET_REQUEST = "asset_request"
    MAINTENANCE_APPROVAL = "maintenance_approval"
    ASSIGNMENT_APPROVAL = "assignment_approval"
    PURCHASE_APPROVAL = "purchase_approval"
    ASSET_RETURN = "asset_return"

# Request Status Enum - lowercase to match frontend
class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# Priority Levels Enum - lowercase to match frontend
class RequestPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

# Requestor Information Schema
class Requestor(BaseModel):
    id: str = Field(..., description="ID of the requestor")
    name: str = Field(..., description="Name of the requestor")
    department: Optional[str] = Field(None, description="Department of the requestor")
    position: Optional[str] = Field(None, description="Position or job title of the requestor")
    email: Optional[str] = Field(None, description="Email of the requestor")
    phone: Optional[str] = Field(None, description="Phone number of the requestor")

    model_config = model_config

# Approver Information Schema
class Approver(BaseModel):
    id: str = Field(..., description="ID of the approver")
    name: str = Field(..., description="Name of the approver")
    status: RequestStatus = Field(default=RequestStatus.PENDING, description="Status of approval")
    role: Optional[str] = Field(None, description="Role or position of the approver")
    date: Optional[str] = Field(None, description="Date of approval/rejection")
    notes: Optional[str] = Field(None, description="Notes provided by the approver")

    model_config = model_config

# Comment Schema
class RequestComment(BaseModel):
    user_id: str = Field(..., description="ID of the comment author")
    user_name: str = Field(..., description="Name of the comment author")
    content: str = Field(..., description="Comment content")

    model_config = model_config

# Asset Request Details Schema
class AssetRequestDetails(BaseModel):
    category: str = Field(..., description="Asset category")
    specifications: str = Field(..., description="Asset specifications")
    purpose: str = Field(..., description="Purpose for requesting the asset")
    
    model_config = model_config

# Maintenance Approval Details Schema
class MaintenanceApprovalDetails(BaseModel):
    asset_id: str = Field(..., description="ID of the asset needing maintenance")
    asset_name: str = Field(..., description="Name of the asset")
    asset_tag: Optional[str] = Field(None, description="Asset tag/identifier")
    issue: str = Field(..., description="Description of the maintenance issue")
    
    model_config = model_config

# Assignment Approval Details Schema
class AssignmentApprovalDetails(BaseModel):
    category: Optional[str] = Field(None, description="Category of assets")
    items: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="List of assets to assign")
    recipients: Optional[str] = Field(None, description="Description of recipients")
    
    model_config = model_config

# Purchase Approval Details Schema
class PurchaseApprovalDetails(BaseModel):
    category: str = Field(..., description="Category of item to purchase")
    specifications: str = Field(..., description="Specifications of item")
    estimated_cost: Optional[float] = Field(None, description="Estimated cost")
    vendor: Optional[str] = Field(None, description="Preferred vendor")
    
    model_config = model_config

# Asset Return Details Schema
class AssetReturnDetails(BaseModel):
    asset_id: str = Field(..., description="ID of the asset being returned")
    asset_name: str = Field(..., description="Name of the asset")
    asset_tag: Optional[str] = Field(None, description="Asset tag/identifier")
    reason: str = Field(..., description="Reason for returning the asset")
    
    model_config = model_config

# Request Schema with all frontend fields
class Request(BaseModel):
    id: str = Field(default_factory=generate_request_id, description="Unique request ID")
    type: RequestType = Field(..., description="Type of request")
    title: str = Field(..., description="Request title")
    requestor: Requestor = Field(..., description="Information about the requestor")
    date_submitted: str = Field(..., description="Date when request was submitted")
    status: RequestStatus = Field(default=RequestStatus.PENDING, description="Current status of the request")
    priority: RequestPriority = Field(default=RequestPriority.MEDIUM, description="Priority level of the request")
    
    # Asset details - structure depends on request type
    asset_details: Dict[str, Any] = Field(..., description="Details specific to the request type")
    
    # Approval Information
    approvers: List[Approver] = Field(default_factory=list, description="List of approvers")
    
    # Comments
    comments: List[RequestComment] = Field(default_factory=list, description="Comments on the request")
    
    # Additional fields from the frontend
    request_id: Optional[str] = Field(None, description="Alternative request identifier")
    description: Optional[str] = Field(None, description="Long description of the request")
    category: Optional[str] = Field(None, description="Request category")
    department: Optional[str] = Field(None, description="Department submitting the request")
    location: Optional[str] = Field(None, description="Location relevant to the request")
    due_date: Optional[str] = Field(None, description="Requested due date")
    reference_number: Optional[str] = Field(None, description="Reference number")
    approval_path: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Approval workflow path")
    attachments: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Attached documents")
    linked_assets: Optional[List[str]] = Field(default_factory=list, description="IDs of linked assets")
    linked_employees: Optional[List[str]] = Field(default_factory=list, description="IDs of linked employees")
    
    # Fields from the frontend tabs
    is_active: Optional[bool] = Field(True, description="Whether the request is active")
    last_updated: Optional[str] = Field(None, description="Date of last update")
    completed_date: Optional[str] = Field(None, description="Date when request was completed")
    
    # Timestamps
    created_at: datetime = Field(default_factory=get_current_datetime, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    
    model_config = model_config

class RequestCreate(BaseModel):
    type: RequestType
    title: str
    requestor: Requestor
    date_submitted: str
    status: RequestStatus = RequestStatus.PENDING
    priority: RequestPriority = RequestPriority.MEDIUM
    asset_details: Dict[str, Any]
    description: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    due_date: Optional[str] = None
    approvers: Optional[List[Approver]] = Field(default_factory=list)
    comments: Optional[List[RequestComment]] = Field(default_factory=list)
    reference_number: Optional[str] = None
    approval_path: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    attachments: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    linked_assets: Optional[List[str]] = Field(default_factory=list)
    linked_employees: Optional[List[str]] = Field(default_factory=list)
    is_active: Optional[bool] = True
    
    model_config = model_config

class RequestUpdate(BaseModel):
    type: Optional[RequestType] = None
    title: Optional[str] = None
    requestor: Optional[Requestor] = None
    date_submitted: Optional[str] = None
    status: Optional[RequestStatus] = None
    priority: Optional[RequestPriority] = None
    asset_details: Optional[Dict[str, Any]] = None
    approvers: Optional[List[Approver]] = None
    comments: Optional[List[RequestComment]] = None
    request_id: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    due_date: Optional[str] = None
    reference_number: Optional[str] = None
    approval_path: Optional[List[Dict[str, Any]]] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    linked_assets: Optional[List[str]] = None
    linked_employees: Optional[List[str]] = None
    is_active: Optional[bool] = None
    last_updated: Optional[str] = None
    completed_date: Optional[str] = None
    
    model_config = model_config

class RequestResponse(BaseModel):
    id: str
    type: str
    title: str
    requestor: Dict[str, Any]
    date_submitted: str
    status: str
    priority: str
    asset_details: Dict[str, Any]
    approvers: List[Dict[str, Any]]
    comments: List[Dict[str, Any]]
    
    model_config = model_config

# For adding a comment to a request
class CommentCreate(BaseModel):
    request_id: str = Field(..., description="ID of the request to comment on")
    author: str = Field(..., description="Name of comment author")
    content: str = Field(..., description="Comment content")
    author_id: Optional[str] = Field(None, description="ID of comment author")
    author_role: Optional[str] = Field(None, description="Role of comment author")
    
    model_config = model_config

# For updating the approval status
class ApprovalUpdate(BaseModel):
    request_id: str = Field(..., description="ID of the request")
    approver_id: str = Field(..., description="ID of the approver")
    status: RequestStatus = Field(..., description="New approval status")
    notes: Optional[str] = Field(None, description="Notes for the approval/rejection")
    
    model_config = model_config 