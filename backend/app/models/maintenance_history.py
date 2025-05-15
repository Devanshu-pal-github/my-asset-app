from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
from bson import ObjectId

class MaintenanceStatus(str, Enum):
    REQUESTED = "requested"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    SCHEDULED = "scheduled"
    OVERDUE = "overdue"
    PENDING = "pending"

class MaintenanceType(str, Enum):
    PREVENTIVE = "preventive"
    CORRECTIVE = "corrective"
    CONDITION_BASED = "condition_based"
    BREAKDOWN = "breakdown"
    EMERGENCY = "emergency"
    ROUTINE = "routine"
    SCHEDULED = "scheduled"
    REPAIR = "repair"
    INSPECTION = "inspection"
    CLEANING = "cleaning"
    REPLACEMENT = "replacement"
    UPGRADE = "upgrade"
    OTHER = "other"

class MaintenanceHistoryEntry(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique maintenance ID")
    asset_id: str = Field(..., description="ID of the asset")
    asset_name: Optional[str] = Field(None, description="Name of the asset at time of maintenance")
    asset_tag: Optional[str] = Field(None, description="Asset tag/identifier")
    category_id: Optional[str] = Field(None, description="Category ID of the asset")
    category_name: Optional[str] = Field(None, description="Category name of the asset")
    maintenance_type: MaintenanceType = Field(..., description="Type of maintenance")
    maintenance_reason: Optional[str] = Field(None, description="Reason for maintenance")
    technician: str = Field(..., description="Technician or service provider")
    technician_contact: Optional[str] = Field(None, description="Contact information for the technician")
    condition_before: str = Field(..., description="Asset condition before maintenance")
    condition_after: Optional[str] = Field(None, description="Asset condition after maintenance")
    maintenance_date: datetime = Field(..., description="Date maintenance was requested")
    scheduled_date: Optional[datetime] = Field(None, description="Date maintenance was scheduled for")
    in_progress_date: Optional[datetime] = Field(None, description="Date maintenance was started")
    completed_date: Optional[datetime] = Field(None, description="Date maintenance was completed")
    next_scheduled_maintenance: Optional[datetime] = Field(None, description="Next scheduled maintenance date")
    status: MaintenanceStatus = Field(..., description="Current maintenance status")
    priority: Optional[str] = Field("Medium", description="Priority of the maintenance request")
    cost: Optional[float] = Field(None, description="Cost of maintenance")
    parts_replaced: List[Dict[str, Any]] = Field(default_factory=list, description="List of parts replaced during maintenance")
    downtime_hours: Optional[float] = Field(None, description="Hours of downtime due to maintenance")
    requested_by: Optional[str] = Field(None, description="ID of employee who requested the maintenance")
    requested_by_name: Optional[str] = Field(None, description="Name of employee who requested the maintenance")
    approved_by: Optional[str] = Field(None, description="ID of employee who approved the maintenance")
    approved_by_name: Optional[str] = Field(None, description="Name of employee who approved the maintenance")
    completed_by: Optional[str] = Field(None, description="ID of employee who marked maintenance as completed")
    completed_by_name: Optional[str] = Field(None, description="Name of employee who marked maintenance as completed")
    location: Optional[str] = Field(None, description="Location where maintenance occurred")
    notes: Optional[str] = Field(None, description="Additional notes")
    completion_notes: Optional[str] = Field(None, description="Notes provided upon completion")
    documents: List[Dict[str, Any]] = Field(default_factory=list, description="Documents related to maintenance")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    
    # Additional fields from Maintenance/index.jsx
    performed_by: Optional[str] = Field(None, description="Person or company who performed the maintenance")
    next_scheduled: Optional[str] = Field(None, description="Date of next scheduled maintenance")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        populate_by_name = True

class MaintenanceRequest(BaseModel):
    asset_id: str
    maintenance_type: MaintenanceType
    maintenance_reason: Optional[str] = None
    technician: str
    technician_contact: Optional[str] = None
    condition_before: str
    scheduled_date: Optional[datetime] = None
    priority: Optional[str] = "Medium"
    cost: Optional[float] = None
    requested_by: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    
    # Additional fields from Maintenance/index.jsx
    performed_by: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True

class MaintenanceUpdate(BaseModel):
    maintenance_id: str
    status: Optional[MaintenanceStatus] = None
    condition_after: Optional[str] = None
    in_progress_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    next_scheduled_maintenance: Optional[datetime] = None
    cost: Optional[float] = None
    parts_replaced: Optional[List[Dict[str, Any]]] = None
    downtime_hours: Optional[float] = None
    approved_by: Optional[str] = None
    completed_by: Optional[str] = None
    completion_notes: Optional[str] = None
    notes: Optional[str] = None
    
    # Additional fields from Maintenance/index.jsx
    performed_by: Optional[str] = None
    next_scheduled: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True

class MaintenanceAttachment(BaseModel):
    id: str = Field(..., description="Unique identifier for the attachment")
    name: str = Field(..., description="Attachment name")
    file_type: str = Field(..., description="Type of file")
    url: str = Field(..., description="URL to the attachment")
    upload_date: str = Field(..., description="Date of upload")
    size: Optional[int] = Field(None, description="Size of attachment in bytes")
    notes: Optional[str] = Field(None, description="Notes about the attachment")

    class Config:
        arbitrary_types_allowed = True

class MaintenanceCost(BaseModel):
    amount: float = Field(..., description="Cost amount")
    currency: str = Field("USD", description="Currency")
    description: Optional[str] = Field(None, description="Description of the cost")
    category: Optional[str] = Field(None, description="Cost category")
    date: Optional[str] = Field(None, description="Date when cost was incurred")
    invoice_number: Optional[str] = Field(None, description="Associated invoice number")
    
    class Config:
        arbitrary_types_allowed = True

class Technician(BaseModel):
    id: Optional[str] = Field(None, description="Technician ID")
    name: str = Field(..., description="Technician name")
    contact: Optional[str] = Field(None, description="Contact information")
    email: Optional[str] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    specialization: Optional[str] = Field(None, description="Area of specialization")
    company: Optional[str] = Field(None, description="Company or organization")
    
    class Config:
        arbitrary_types_allowed = True

class StatusUpdate(BaseModel):
    status: str = Field(..., description="New status")
    date: str = Field(..., description="Date of update")
    updated_by: Optional[str] = Field(None, description="Person who updated the status")
    notes: Optional[str] = Field(None, description="Notes about the update")
    
    class Config:
        arbitrary_types_allowed = True

class MaintenanceHistory(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique maintenance record ID")
    
    asset_id: str = Field(..., description="ID of the asset under maintenance")
    asset_name: str = Field(..., description="Name of the asset")
    asset_tag: str = Field(..., description="Asset tag or identifier")
    category_id: Optional[str] = Field(None, description="Category ID of the asset")
    category_name: Optional[str] = Field(None, description="Category name of the asset")
    
    maintenance_type: MaintenanceType = Field(..., description="Type of maintenance")
    status: MaintenanceStatus = Field(..., description="Current status of maintenance")
    request_date: str = Field(..., description="Date when maintenance was requested")
    scheduled_date: Optional[str] = Field(None, description="Date when maintenance is scheduled")
    start_date: Optional[str] = Field(None, description="Date when maintenance started")
    completion_date: Optional[str] = Field(None, description="Date when maintenance was completed")
    description: str = Field(..., description="Description of the maintenance issue")
    resolution: Optional[str] = Field(None, description="Description of how the issue was resolved")
    estimated_duration: Optional[int] = Field(None, description="Estimated duration in hours")
    actual_duration: Optional[int] = Field(None, description="Actual duration in hours")
    
    assigned_to: Optional[str] = Field(None, description="ID of person assigned to maintenance")
    assigned_to_name: Optional[str] = Field(None, description="Name of person assigned to maintenance")
    assigned_date: Optional[str] = Field(None, description="Date when maintenance was assigned")
    technician: Optional[Technician] = Field(None, description="Technician information")
    
    estimated_cost: Optional[float] = Field(None, description="Estimated cost of maintenance")
    actual_cost: Optional[float] = Field(None, description="Actual cost of maintenance")
    costs: List[MaintenanceCost] = Field(default_factory=list, description="Detailed cost breakdown")
    
    priority: Optional[str] = Field(None, description="Maintenance priority (high, medium, low)")
    severity: Optional[str] = Field(None, description="Issue severity (critical, major, minor)")
    
    attachments: List[MaintenanceAttachment] = Field(default_factory=list, description="Attached files")
    
    notes: Optional[str] = Field(None, description="Additional notes")
    reported_by: Optional[str] = Field(None, description="Person who reported the issue")
    reported_by_name: Optional[str] = Field(None, description="Name of person who reported the issue")
    status_updates: List[StatusUpdate] = Field(default_factory=list, description="History of status changes")
    is_warranty_covered: Optional[bool] = Field(False, description="Whether maintenance is covered by warranty")
    is_recurring: Optional[bool] = Field(False, description="Whether this is a recurring maintenance")
    recurrence_interval: Optional[int] = Field(None, description="Interval for recurring maintenance")
    recurrence_unit: Optional[str] = Field(None, description="Unit for recurrence interval (days, weeks, months)")
    next_maintenance_date: Optional[str] = Field(None, description="Date for next maintenance if recurring")
    
    issue_type: Optional[str] = Field(None, description="Type of issue")
    cause: Optional[str] = Field(None, description="Cause of the issue")
    parts_replaced: Optional[List[str]] = Field(default_factory=list, description="Parts that were replaced")
    downtime: Optional[int] = Field(None, description="Downtime in hours")
    impact: Optional[str] = Field(None, description="Impact of the issue")
    troubleshooting_steps: Optional[str] = Field(None, description="Steps taken to troubleshoot")
    
    # Fields from MaintenanceHistoryTab in index.jsx
    service_type: Optional[str] = Field(None, description="Service type (alias for maintenance_type)")
    condition_before: Optional[str] = Field(None, description="Condition before maintenance")
    condition_after: Optional[str] = Field(None, description="Condition after maintenance")
    maintenance_date: Optional[str] = Field(None, description="Date of maintenance")
    completed_date: Optional[str] = Field(None, description="Date when maintenance was completed")
    cost: Optional[float] = Field(None, description="Cost of maintenance")
    completed: Optional[bool] = Field(False, description="Whether maintenance is completed")
    
    # Fields from Maintenance/index.jsx
    performed_by: Optional[str] = Field(None, description="Person or company who performed the maintenance")
    next_scheduled: Optional[str] = Field(None, description="Date of next scheduled maintenance")
    
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        populate_by_name = True

class MaintenanceCreate(BaseModel):
    asset_id: str
    asset_name: str
    asset_tag: str
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    maintenance_type: MaintenanceType
    status: MaintenanceStatus = MaintenanceStatus.REQUESTED
    request_date: str
    scheduled_date: Optional[str] = None
    description: str
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_date: Optional[str] = None
    priority: Optional[str] = None
    severity: Optional[str] = None
    estimated_cost: Optional[float] = None
    notes: Optional[str] = None
    reported_by: Optional[str] = None
    reported_by_name: Optional[str] = None
    is_warranty_covered: Optional[bool] = False
    is_recurring: Optional[bool] = False
    recurrence_interval: Optional[int] = None
    recurrence_unit: Optional[str] = None
    issue_type: Optional[str] = None
    service_type: Optional[str] = None
    condition_before: Optional[str] = None
    condition_after: Optional[str] = None
    maintenance_date: Optional[str] = None
    completed_date: Optional[str] = None
    cost: Optional[float] = None
    completed: Optional[bool] = False
    
    # Additional fields from Maintenance/index.jsx
    performed_by: Optional[str] = None
    next_scheduled: Optional[str] = None
    technician: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True

class MaintenanceUpdate(BaseModel):
    asset_id: Optional[str] = None
    asset_name: Optional[str] = None
    asset_tag: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    maintenance_type: Optional[MaintenanceType] = None
    status: Optional[MaintenanceStatus] = None
    request_date: Optional[str] = None
    scheduled_date: Optional[str] = None
    start_date: Optional[str] = None
    completion_date: Optional[str] = None
    description: Optional[str] = None
    resolution: Optional[str] = None
    estimated_duration: Optional[int] = None
    actual_duration: Optional[int] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_date: Optional[str] = None
    technician: Optional[Technician] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    costs: Optional[List[MaintenanceCost]] = None
    priority: Optional[str] = None
    severity: Optional[str] = None
    attachments: Optional[List[MaintenanceAttachment]] = None
    notes: Optional[str] = None
    reported_by: Optional[str] = None
    reported_by_name: Optional[str] = None
    status_updates: Optional[List[StatusUpdate]] = None
    is_warranty_covered: Optional[bool] = None
    is_recurring: Optional[bool] = None
    recurrence_interval: Optional[int] = None
    recurrence_unit: Optional[str] = None
    next_maintenance_date: Optional[str] = None
    issue_type: Optional[str] = None
    cause: Optional[str] = None
    parts_replaced: Optional[List[str]] = None
    downtime: Optional[int] = None
    impact: Optional[str] = None
    troubleshooting_steps: Optional[str] = None
    service_type: Optional[str] = None
    condition_before: Optional[str] = None
    condition_after: Optional[str] = None
    maintenance_date: Optional[str] = None
    completed_date: Optional[str] = None
    cost: Optional[float] = None
    completed: Optional[bool] = None
    
    # Additional fields from Maintenance/index.jsx
    performed_by: Optional[str] = None
    next_scheduled: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True

class MaintenanceResponse(BaseModel):
    id: str = Field(..., alias="_id")
    asset_id: str
    asset_name: str
    asset_tag: str
    maintenance_type: str
    service_type: Optional[str] = None
    status: str
    request_date: str
    scheduled_date: Optional[str] = None
    completion_date: Optional[str] = None
    completed_date: Optional[str] = None
    description: str
    assigned_to_name: Optional[str] = None
    technician: Optional[str] = None
    condition_before: Optional[str] = None
    condition_after: Optional[str] = None
    maintenance_date: Optional[str] = None
    priority: Optional[str] = None
    severity: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    cost: Optional[float] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None
    is_warranty_covered: Optional[bool] = None
    
    # Additional fields from Maintenance/index.jsx
    performed_by: Optional[str] = None
    next_scheduled: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        populate_by_name = True