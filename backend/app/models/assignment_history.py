from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class AssignmentHistoryEntry(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique assignment ID")
    asset_id: str = Field(..., description="ID of the assigned asset")
    asset_name: Optional[str] = Field(None, description="Name of the asset at time of assignment")
    assigned_to: List[str] = Field(..., description="List of employee IDs assigned to the asset")
    entity_type: Optional[str] = Field(None, description="Type of entity, e.g., 'Employee'")
    assignment_type: Optional[str] = Field(None, description="Type of assignment, e.g., 'Permanent', 'Temporary'")
    department: Optional[str] = Field(None, description="Department at time of assignment")
    condition_at_assignment: str = Field(..., description="Asset condition at assignment")
    condition_at_return: Optional[str] = Field(None, description="Asset condition at return")
    assignment_date: datetime = Field(..., description="Date of assignment")
    return_date: Optional[datetime] = Field(None, description="Date of return")
    is_active: bool = Field(True, description="Whether the assignment is active")
    notes: Optional[str] = Field(None, description="Additional notes")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}