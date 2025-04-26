from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime
from bson import ObjectId

class MaintenanceStatus(str, Enum):
    REQUESTED = "Requested"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class MaintenanceHistoryEntry(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique maintenance ID")
    maintenance_type: str = Field(..., description="Type of maintenance, e.g., 'Repair', 'Inspection'")
    technician: str = Field(..., description="Technician or service provider")
    condition_before: str = Field(..., description="Asset condition before maintenance")
    condition_after: Optional[str] = Field(None, description="Asset condition after maintenance")
    maintenance_date: datetime = Field(..., description="Date maintenance was requested")
    completed_date: Optional[datetime] = Field(None, description="Date maintenance was completed")
    status: MaintenanceStatus = Field(..., description="Current maintenance status")
    cost: Optional[float] = Field(None, description="Cost of maintenance")
    notes: Optional[str] = Field(None, description="Additional notes")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class MaintenanceRequest(BaseModel):
    asset_id: str
    maintenance_type: str
    technician: str
    condition: str
    cost: Optional[float] = None
    notes: Optional[str] = None

class MaintenanceUpdate(BaseModel):
    asset_id: str
    maintenance_id: str
    condition_after: str
    completed_date: datetime
    notes: Optional[str] = None