from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum
from datetime import datetime
from bson import ObjectId
from .assignment_history import AssignmentHistoryEntry
from .maintenance_history import MaintenanceHistoryEntry
from .document import DocumentEntry

class AssetStatus(str, Enum):
    AVAILABLE = "Available"
    IN_USE = "In Use"
    UNDER_MAINTENANCE = "Under Maintenance"
    MAINTENANCE_REQUESTED = "Maintenance Requested"
    MAINTENANCE_DONE = "Maintenance Done"
    CONSUMED = "Consumed"
    RETIRED = "Retired"
    LOST = "Lost"

class AssetItem(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique asset ID")
    category_id: str = Field(..., description="Reference to AssetCategory ID")
    name: str = Field(..., description="Asset name, e.g., 'Dell XPS 13'")
    asset_tag: str = Field(..., description="Unique tag, e.g., 'Hardware-001'")
    serial_number: Optional[str] = Field(None, description="Serial number of the asset")
    status: AssetStatus = Field(..., description="Current status of the asset")
    condition: str = Field(..., description="Physical condition, e.g., 'Good'")
    purchase_date: datetime = Field(..., description="Date of purchase")
    purchase_cost: float = Field(..., description="Initial purchase cost")
    current_value: float = Field(..., description="Current depreciated value")
    warranty_expiry: Optional[datetime] = Field(None, description="Warranty expiration date")
    maintenance_due_date: Optional[datetime] = Field(None, description="Next maintenance due date")
    vendor: Optional[str] = Field(None, description="Vendor or supplier name")
    insurance_policy: Optional[str] = Field(None, description="Insurance policy details")
    disposal_date: Optional[datetime] = Field(None, description="Date of disposal or retirement")
    department: Optional[str] = Field(None, description="Assigned department")
    location: Optional[str] = Field(None, description="Physical location, e.g., 'Office A'")
    specifications: Optional[Dict[str, str]] = Field(None, description="Technical specs, e.g., {'RAM': '16GB'}")
    current_assignee_id: Optional[str] = Field(None, description="ID of current assignee")
    current_assignment_date: Optional[datetime] = Field(None, description="Date of current assignment")
    notes: Optional[str] = Field(None, description="Additional notes")
    assignment_history: List[AssignmentHistoryEntry] = Field(default_factory=list, description="Assignment records")
    maintenance_history: List[MaintenanceHistoryEntry] = Field(default_factory=list, description="Maintenance records")
    documents: List[DocumentEntry] = Field(default_factory=list, description="Document references")
    has_active_assignment: bool = Field(False, description="Whether the asset is currently assigned")
    is_operational: bool = Field(True, description="Whether the asset is operational")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AssetItemCreate(BaseModel):
    category_id: str
    name: str
    asset_tag: str
    serial_number: Optional[str] = None
    status: AssetStatus
    condition: str
    purchase_date: datetime
    purchase_cost: float
    warranty_expiry: Optional[datetime] = None
    maintenance_due_date: Optional[datetime] = None
    vendor: Optional[str] = None
    insurance_policy: Optional[str] = None
    disposal_date: Optional[datetime] = None
    department: Optional[str] = None
    location: Optional[str] = None
    specifications: Optional[Dict[str, str]] = None
    notes: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True