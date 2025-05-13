from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from enum import Enum

class AssignmentStatus(str, Enum):
    ACTIVE = "Active"
    RETURNED = "Returned"
    OVERDUE = "Overdue"
    PENDING = "Pending"
    CANCELLED = "Cancelled"

class AssignmentType(str, Enum):
    PERMANENT = "Permanent"
    TEMPORARY = "Temporary"
    PROJECT = "Project-based"
    LOAN = "Loan"

class EntityType(str, Enum):
    EMPLOYEE = "Employee"
    DEPARTMENT = "Department"
    TEAM = "Team"
    OTHER = "Other"

class AssignmentHistoryEntry(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique assignment ID")
    asset_id: str = Field(..., description="ID of the assigned asset")
    asset_name: Optional[str] = Field(None, description="Name of the asset at time of assignment")
    asset_tag: Optional[str] = Field(None, description="Asset tag/identifier")
    category_id: Optional[str] = Field(None, description="Category ID of the asset")
    category_name: Optional[str] = Field(None, description="Category name of the asset")
    assigned_to: List[str] = Field(..., description="List of employee IDs assigned to the asset")
    assigned_to_names: List[str] = Field(default_factory=list, description="Names of assigned entities")
    assigned_by: Optional[str] = Field(None, description="ID of employee who made the assignment")
    assigned_by_name: Optional[str] = Field(None, description="Name of employee who made the assignment")
    entity_type: Optional[EntityType] = Field(None, description="Type of entity assigned to")
    assignment_type: Optional[AssignmentType] = Field(None, description="Type of assignment")
    assignment_reason: Optional[str] = Field(None, description="Reason for assignment")
    department: Optional[str] = Field(None, description="Department at time of assignment")
    location: Optional[str] = Field(None, description="Location at time of assignment")
    condition_at_assignment: str = Field(..., description="Asset condition at assignment")
    condition_at_return: Optional[str] = Field(None, description="Asset condition at return")
    assignment_date: datetime = Field(..., description="Date of assignment")
    expected_return_date: Optional[datetime] = Field(None, description="Expected date of return")
    return_date: Optional[datetime] = Field(None, description="Actual date of return")
    returned_by: Optional[str] = Field(None, description="ID of employee who returned the asset")
    returned_by_name: Optional[str] = Field(None, description="Name of employee who returned the asset")
    status: AssignmentStatus = Field(AssignmentStatus.ACTIVE, description="Current status of the assignment")
    is_active: bool = Field(True, description="Whether the assignment is active")
    notes: Optional[str] = Field(None, description="Additional notes")
    return_notes: Optional[str] = Field(None, description="Notes provided during return")
    documents: List[Dict[str, Any]] = Field(default_factory=list, description="Documents related to assignment")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        populate_by_name = True

class AssignmentCreate(BaseModel):
    asset_id: str
    assigned_to: List[str]
    entity_type: Optional[EntityType] = EntityType.EMPLOYEE
    assignment_type: Optional[AssignmentType] = AssignmentType.PERMANENT
    assignment_reason: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    condition_at_assignment: str
    expected_return_date: Optional[datetime] = None
    assigned_by: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True

class AssignmentReturn(BaseModel):
    condition_at_return: str
    return_notes: Optional[str] = None
    returned_by: Optional[str] = None
    
    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True