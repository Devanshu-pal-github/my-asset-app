from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

class AssignedAsset(BaseModel):
    asset_id: str = Field(..., description="ID of the assigned asset")
    asset_name: Optional[str] = Field(None, description="Name of the assigned asset")
    asset_category: Optional[str] = Field(None, description="Category of the assigned asset")
    category_id: Optional[str] = Field(None, description="Category ID of the assigned asset")
    assigned_at: datetime = Field(default_factory=datetime.utcnow, description="Assignment timestamp")
    due_date: Optional[datetime] = Field(None, description="Date when the asset should be returned")
    assignment_notes: Optional[str] = Field(None, description="Notes about the assignment")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class EmployeeContact(BaseModel):
    email: EmailStr = Field(..., description="Employee's email address")
    phone: Optional[str] = Field(None, description="Employee's phone number")
    alternate_phone: Optional[str] = Field(None, description="Employee's alternate phone number")
    address: Optional[str] = Field(None, description="Employee's address")

    class Config:
        arbitrary_types_allowed = True

class EmployeeMetadata(BaseModel):
    joining_date: Optional[datetime] = Field(None, description="Date when employee joined")
    leaving_date: Optional[datetime] = Field(None, description="Date when employee left")
    manager_id: Optional[str] = Field(None, description="ID of the employee's manager")
    manager_name: Optional[str] = Field(None, description="Name of the employee's manager")
    skills: List[str] = Field(default_factory=list, description="Employee's skills")
    employee_type: Optional[str] = Field(None, description="Type of employee (e.g., full-time, contractor)")
    
    class Config:
        arbitrary_types_allowed = True

class Employee(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique employee ID")
    employee_id: str = Field(..., description="Unique employee identifier, e.g., 'EMP001'")
    first_name: str = Field(..., description="Employee's first name")
    last_name: str = Field(..., description="Employee's last name")
    full_name: Optional[str] = Field(None, description="Employee's full name")
    department: Optional[str] = Field(None, description="Employee's department")
    location: Optional[str] = Field(None, description="Employee's location")
    status: Optional[str] = Field("Active", description="Employee status, e.g., 'Active', 'Inactive'")
    assigned_assets: List[AssignedAsset] = Field(default_factory=list, description="List of assigned assets")
    email: str = Field(..., description="Employee's email address")
    role: Optional[str] = Field(None, description="Employee's role or job title")
    designation: Optional[str] = Field(None, description="Employee's designation")
    phone: Optional[str] = Field(None, description="Employee's phone number")
    is_active: bool = Field(True, description="Indicates if the employee is active")
    documents: List[Dict[str, Any]] = Field(default_factory=list, description="List of associated documents")
    avatar_url: Optional[str] = Field(None, description="URL to employee's avatar image")
    contact_info: Optional[EmployeeContact] = Field(None, description="Detailed contact information")
    metadata: Optional[EmployeeMetadata] = Field(None, description="Additional employee metadata")
    asset_count: int = Field(0, description="Number of assets assigned to employee")
    total_asset_value: float = Field(0.0, description="Total value of assets assigned to employee")
    joined_at: Optional[datetime] = Field(None, description="Date employee joined")
    last_activity: Optional[datetime] = Field(None, description="Date of employee's last activity")
    notes: Optional[str] = Field(None, description="Additional notes about the employee")
    tags: List[str] = Field(default_factory=list, description="Tags associated with employee")
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
    location: Optional[str] = None
    status: Optional[str] = "Active"
    email: str
    role: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = Field(True)
    avatar_url: Optional[str] = None
    contact_info: Optional[EmployeeContact] = None
    metadata: Optional[EmployeeMetadata] = None
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True