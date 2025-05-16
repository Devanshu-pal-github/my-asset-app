from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
from .utils import (
    model_config,
    generate_employee_id,
    generate_uuid,
    get_current_datetime
)

# Enum for Employee Status
class EmployeeStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"
    CONTRACT = "contract"
    PROBATION = "probation"

# Assigned Asset Schema
class AssignedAsset(BaseModel):
    asset_id: str = Field(..., description="ID of the assigned asset")
    asset_name: str = Field(..., description="Name of the assigned asset")
    asset_tag: str = Field(..., description="Asset tag or identifier")
    category_id: Optional[str] = Field(None, description="Category ID of the asset")
    category_name: Optional[str] = Field(None, description="Category name of the asset")
    assignment_date: str = Field(..., description="Date when the asset was assigned")
    due_date: Optional[str] = Field(None, description="Due date for returning the asset")
    assignment_status: str = Field("assigned", description="Status of the assignment")
    assignment_notes: Optional[str] = Field(None, description="Notes about the assignment")
    condition: Optional[str] = Field(None, description="Condition of the asset when assigned")

    model_config = model_config

# Employee Contact Information
class EmployeeContact(BaseModel):
    email: str = Field(..., description="Official email address")
    personal_email: Optional[str] = Field(None, description="Personal email address")
    phone: Optional[str] = Field(None, description="Primary phone number")
    mobile: Optional[str] = Field(None, description="Mobile phone number")
    emergency_contact_name: Optional[str] = Field(None, description="Emergency contact name")
    emergency_contact_phone: Optional[str] = Field(None, description="Emergency contact phone")
    address: Optional[str] = Field(None, description="Residential address")
    city: Optional[str] = Field(None, description="City of residence")
    state: Optional[str] = Field(None, description="State of residence")
    postal_code: Optional[str] = Field(None, description="Postal code")
    country: Optional[str] = Field(None, description="Country of residence")

    model_config = model_config

# Employee Metadata
class EmployeeMetadata(BaseModel):
    joining_date: Optional[str] = Field(None, description="Date of joining")
    last_working_date: Optional[str] = Field(None, description="Last working date if applicable")
    manager_id: Optional[str] = Field(None, description="ID of the employee's manager")
    manager_name: Optional[str] = Field(None, description="Name of the employee's manager")
    location: Optional[str] = Field(None, description="Work location")
    workstation_id: Optional[str] = Field(None, description="Workstation or desk identifier")
    skills: Optional[List[str]] = Field(default_factory=list, description="List of skills")
    certifications: Optional[List[str]] = Field(default_factory=list, description="List of certifications")
    notes: Optional[str] = Field(None, description="Additional notes about the employee")
    employee_type: Optional[str] = Field(None, description="Type of employee (full-time, contract, etc.)")
    probation_end_date: Optional[str] = Field(None, description="End date of probation period if applicable")
    reporting_to: Optional[str] = Field(None, description="Name of person the employee reports to")
    job_title: Optional[str] = Field(None, description="Job title")
    role: Optional[str] = Field(None, description="Role in the organization")
    team: Optional[str] = Field(None, description="Team or group the employee belongs to")
    hire_date: Optional[str] = Field(None, description="Date of hire (from EmployeeAssignment)")
    designation: Optional[str] = Field(None, description="Designation (from EmployeeAssignment)")
    created_at: Optional[str] = Field(None, description="Date when employee record was created")

    model_config = model_config

# Employee Schema with all required frontend fields
class Employee(BaseModel):
    id: str = Field(default_factory=generate_employee_id, description="Unique employee ID")
    employee_id: str = Field(..., description="Employee ID (e.g., EMP001)")
    first_name: str = Field(..., description="First name")
    last_name: str = Field(..., description="Last name")
    full_name: Optional[str] = Field(None, description="Full name - first name + last name")
    department: str = Field(..., description="Department")
    status: EmployeeStatus = Field(default=EmployeeStatus.ACTIVE, description="Current status")
    
    # Contact Information
    contact: EmployeeContact = Field(..., description="Contact information")
    
    # Employee Metadata
    metadata: EmployeeMetadata = Field(..., description="Employee metadata")
    
    # Asset Assignment Information
    assigned_assets: List[AssignedAsset] = Field(default_factory=list, description="List of assigned assets")
    total_assigned_assets: Optional[int] = Field(0, description="Total number of assets assigned")
    total_asset_value: Optional[float] = Field(0.0, description="Total value of assigned assets")
    
    # Fields from frontend components - EmployeeAssignment.jsx
    name: Optional[str] = Field(None, description="Full name (alias for full_name)")
    email: Optional[str] = Field(None, description="Email (alias for contact.email)")
    phone: Optional[str] = Field(None, description="Phone (alias for contact.phone)")
    role: Optional[str] = Field(None, description="Role in organization (alias for metadata.role)")
    position: Optional[str] = Field(None, description="Position or job title")
    hire_date: Optional[str] = Field(None, description="Date of hire")
    designation: Optional[str] = Field(None, description="Job designation")
    department_id: Optional[str] = Field(None, description="Department ID")
    manager: Optional[str] = Field(None, description="Manager name")
    asset_count: Optional[int] = Field(0, description="Count of assets assigned")
    job_title: Optional[str] = Field(None, description="Job title (from EmployeeAssignment)") 
    is_manager: Optional[bool] = Field(False, description="Whether the employee is a manager")
    
    # Additional fields from frontend
    employee_type: Optional[str] = Field(None, description="Type of employee")
    location: Optional[str] = Field(None, description="Employee location")
    avatar_url: Optional[str] = Field(None, description="URL to employee avatar image")
    created_at: datetime = Field(default_factory=get_current_datetime, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    
    # Assignment related fields used in frontend 
    asset_assignments: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Asset assignment history")
    assignment_history: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="History of assignments")
    
    # Fields specifically from EmployeeAssignment.jsx
    allow_multiple_assignments: Optional[bool] = Field(False, description="Whether the employee can have multiple asset assignments")
    current_assignee_id: Optional[List[str]] = Field(default_factory=list, description="IDs of current assignees")
    
    # Fields from EmployeeAssets/index.jsx
    is_active: Optional[bool] = Field(True, description="Whether the employee is active")
    
    # Fields from EmployeeDetails/index.jsx
    current_assets: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Currently assigned assets")
    
    # Count of assigned assets
    assigned_assets_count: Optional[int] = Field(0, description="Count of assets assigned to the employee")
    
    model_config = model_config

class EmployeeCreate(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    department: str
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    contact: EmployeeContact
    metadata: EmployeeMetadata
    
    # Additional fields
    department_id: Optional[str] = None
    position: Optional[str] = None
    hire_date: Optional[str] = None
    designation: Optional[str] = None
    is_manager: Optional[bool] = False
    employee_type: Optional[str] = None
    location: Optional[str] = None
    job_title: Optional[str] = None
    is_active: Optional[bool] = True
    current_assets: Optional[List[Dict[str, Any]]] = None
    
    model_config = model_config

class EmployeeUpdate(BaseModel):
    employee_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    status: Optional[EmployeeStatus] = None
    contact: Optional[EmployeeContact] = None
    metadata: Optional[EmployeeMetadata] = None
    assigned_assets: Optional[List[AssignedAsset]] = None
    total_assigned_assets: Optional[int] = None
    total_asset_value: Optional[float] = None
    
    # Fields from frontend components
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    position: Optional[str] = None
    hire_date: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[str] = None
    manager: Optional[str] = None
    asset_count: Optional[int] = None
    is_manager: Optional[bool] = None
    employee_type: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    job_title: Optional[str] = None
    
    # Assignment related fields
    asset_assignments: Optional[List[Dict[str, Any]]] = None
    assignment_history: Optional[List[Dict[str, Any]]] = None
    allow_multiple_assignments: Optional[bool] = None
    current_assignee_id: Optional[List[str]] = None
    
    # Additional fields from frontend
    is_active: Optional[bool] = None
    current_assets: Optional[List[Dict[str, Any]]] = None
    assigned_assets_count: Optional[int] = None
    
    model_config = model_config

# For employee response in list views
class EmployeeResponse(BaseModel):
    id: str
    employee_id: str
    first_name: str
    last_name: str
    full_name: Optional[str] = None
    department: str
    status: str
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    role: Optional[str] = None
    total_assigned_assets: Optional[int] = None
    department_id: Optional[str] = None
    job_title: Optional[str] = None
    is_active: Optional[bool] = None
    assigned_assets: Optional[int] = None  # Alias for total_assigned_assets or assigned_assets_count
    
    model_config = model_config