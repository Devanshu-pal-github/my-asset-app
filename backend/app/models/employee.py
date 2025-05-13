from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class AssignedAsset(BaseModel):
    asset_id: str = Field(..., description="ID of the assigned asset")
    assigned_at: datetime = Field(default_factory=datetime.utcnow, description="Assignment timestamp")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Employee(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique employee ID")
    employee_id: str = Field(..., description="Unique employee identifier, e.g., 'EMP001'")
    first_name: str = Field(..., description="Employee's first name")
    last_name: str = Field(..., description="Employee's last name")
    department: Optional[str] = Field(None, description="Employee's department")
    status: Optional[str] = Field(None, description="Employee status, e.g., 'Active'")
    assigned_assets: List[AssignedAsset] = Field(default_factory=list, description="List of assigned assets")
    email: str = Field(..., description="Employee's email address")
    role: Optional[str] = Field(None, description="Employee's role or job title")
    phone: Optional[str] = Field(None, description="Employee's phone number")
    is_active: bool = Field(True, description="Indicates if the employee is active")
    documents: List[dict] = Field(default_factory=list, description="List of associated documents")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        populate_by_name = True  # Updated from allow_population_by_field_name

class EmployeeCreate(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    department: Optional[str] = None
    status: Optional[str] = None
    email: str
    role: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = Field(True)

    class Config:
        arbitrary_types_allowed = True