from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
from bson import ObjectId

class MaintenanceStatus(str, Enum):
    REQUESTED = "Requested"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    SCHEDULED = "Scheduled"
    OVERDUE = "Overdue"

class MaintenanceType(str, Enum):
    REPAIR = "Repair"
    ROUTINE = "Routine"
    UPGRADE = "Upgrade"
    INSPECTION = "Inspection"
    CALIBRATION = "Calibration"
    OTHER = "Other"

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
    
    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True