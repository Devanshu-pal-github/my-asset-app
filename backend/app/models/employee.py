from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class AssignedAsset(BaseModel):
    asset_id: str = Field(..., description="ID of the assigned asset")
    assigned_at: datetime = Field(default_factory=datetime.utcnow, description="Assignment timestamp")

class Employee(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique employee ID")
    employee_id: str = Field(..., description="Unique employee identifier, e.g., 'EMP001'")
    name: str = Field(..., description="Employee's full name")
    email: str = Field(..., description="Employee's email address")
    department: Optional[str] = Field(None, description="Employee's department")
    role: Optional[str] = Field(None, description="Employee's role or job title")
    is_active: bool = Field(True, description="Whether the employee is active")
    assigned_assets: List[AssignedAsset] = Field(default_factory=list, description="List of assigned assets")
    documents: List[dict] = Field(default_factory=list, description="List of associated documents")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class EmployeeCreate(BaseModel):
    employee_id: str
    name: str
    email: str
    department: Optional[str] = None
    role: Optional[str] = None
    is_active: bool = True

    class Config:
        arbitrary_types_allowed = True