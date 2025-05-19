from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from .utils import (
    model_config,
    generate_assignment_id,
    generate_uuid,
    get_current_datetime
)

class AssignmentStatus(str, Enum):
    ASSIGNED = "assigned"
    RETURNED = "returned"
    PENDING = "pending"
    OVERDUE = "overdue"
    LOST = "lost"
    DAMAGED = "damaged"
    TRANSFERRED = "transferred"
    EXTENDED = "extended"

class AssignmentType(str, Enum):
    PERMANENT = "permanent"
    TEMPORARY = "temporary"
    PROJECT = "project"
    REPLACEMENT = "replacement"
    LOANER = "loaner"
    TRANSFER = "transfer"

class EntityType(str, Enum):
    EMPLOYEE = "Employee"
    DEPARTMENT = "Department"
    TEAM = "Team"
    OTHER = "Other"

class ConditionUpdate(BaseModel):
    condition_before: str = Field(..., description="Condition before assignment/return")
    condition_after: Optional[str] = Field(None, description="Condition after return")
    condition_notes: Optional[str] = Field(None, description="Notes about condition changes")
    damage_details: Optional[str] = Field(None, description="Details about any damage")
    
    model_config = model_config

class AssignmentAttachment(BaseModel):
    id: str = Field(default_factory=generate_uuid, description="Unique identifier for the attachment")
    name: str = Field(..., description="Attachment name")
    file_type: str = Field(..., description="Type of file")
    url: str = Field(..., description="URL to the attachment")
    upload_date: str = Field(..., description="Date of upload")
    notes: Optional[str] = Field(None, description="Notes about the attachment")
    
    model_config = model_config

class AssignmentHistoryEntry(BaseModel):
    id: str = Field(default_factory=generate_assignment_id, description="Unique assignment record ID")
    
    # Asset Information
    asset_id: str = Field(..., description="ID of the assigned asset")
    asset_name: str = Field(..., description="Name of the assigned asset")
    asset_tag: str = Field(..., description="Asset tag or identifier")
    category_id: Optional[str] = Field(None, description="Category ID of the asset")
    category_name: Optional[str] = Field(None, description="Category name of the asset")
    
    # Assignment Details
    assignment_type: AssignmentType = Field(..., description="Type of assignment")
    status: AssignmentStatus = Field(default=AssignmentStatus.ASSIGNED, description="Current status of assignment")
    assigned_date: str = Field(..., description="Date when asset was assigned")
    expected_return_date: Optional[str] = Field(None, description="Expected return date if temporary assignment")
    actual_return_date: Optional[str] = Field(None, description="Actual date of return if returned")
    assignment_notes: Optional[str] = Field(None, description="Notes about the assignment")
    
    # Assignee Information
    assigned_to: str = Field(..., description="ID of employee asset is assigned to")
    assigned_to_name: str = Field(..., description="Name of employee asset is assigned to")
    assigned_by: Optional[str] = Field(None, description="ID of person who made the assignment")
    assigned_by_name: Optional[str] = Field(None, description="Name of person who made the assignment")
    department: Optional[str] = Field(None, description="Department of assignee")
    location: Optional[str] = Field(None, description="Location of assignee")
    entity_type: Optional[str] = Field("Employee", description="Type of entity asset is assigned to")
    
    # Return Information
    returned_date: Optional[str] = Field(None, description="Date when asset was returned")
    returned_to: Optional[str] = Field(None, description="ID of person who received the return")
    returned_to_name: Optional[str] = Field(None, description="Name of person who received the return")
    return_notes: Optional[str] = Field(None, description="Notes about the return")
    
    # Condition Information
    condition_details: Optional[ConditionUpdate] = Field(None, description="Condition before and after assignment")
    condition_at_assignment: Optional[str] = Field(None, description="Condition at time of assignment")
    
    # Attachments (signatures, photos, etc.)
    attachments: List[AssignmentAttachment] = Field(default_factory=list, description="Attached files")
    
    # Additional Information
    terms_accepted: Optional[bool] = Field(False, description="Whether terms were accepted by assignee")
    acceptance_signature: Optional[str] = Field(None, description="URL to acceptance signature image")
    return_signature: Optional[str] = Field(None, description="URL to return signature image")
    checkout_condition: Optional[str] = Field(None, description="Condition at checkout")
    checkin_condition: Optional[str] = Field(None, description="Condition at checkin")
    is_active: Optional[bool] = Field(True, description="Whether the assignment is currently active")
    
    # Fields from AssignmentHistoryTab in index.jsx
    assigned_at: Optional[str] = Field(None, description="Date when asset was assigned (alias)")
    unassigned_at: Optional[str] = Field(None, description="Date when asset was unassigned (alias)")
    notes: Optional[str] = Field(None, description="Notes (alias)")
    
    # Additional fields from frontend
    assignment_id: Optional[str] = Field(None, description="Assignment ID used in frontend")
    duration: Optional[int] = Field(None, description="Duration of assignment in days")
    assignment_reason: Optional[str] = Field(None, description="Reason for assignment")
    return_reason: Optional[str] = Field(None, description="Reason for return")
    due_date: Optional[str] = Field(None, description="Due date (alias for expected_return_date)")
    extended_date: Optional[str] = Field(None, description="Extended return date if extended")
    extension_reason: Optional[str] = Field(None, description="Reason for extension")
    employee_id: Optional[str] = Field(None, description="Employee ID (alias for assigned_to)")
    employee_name: Optional[str] = Field(None, description="Employee name (alias for assigned_to_name)")
    department_id: Optional[str] = Field(None, description="Department ID")
    
    # History
    status_history: List[Dict[str, Any]] = Field(default_factory=list, description="History of status changes")
    
    # Fields from EmployeeAssignment and EmployeeUnassignment
    current_assignee_id: Optional[str] = Field(None, description="ID of current assignee")
    current_assignee_name: Optional[str] = Field(None, description="Name of current assignee")
    
    # Timestamps
    created_at: datetime = Field(default_factory=get_current_datetime, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    
    model_config = model_config

class AssignmentCreate(BaseModel):
    asset_id: str
    asset_name: str
    asset_tag: str
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    assignment_type: AssignmentType
    status: AssignmentStatus = AssignmentStatus.ASSIGNED
    assigned_date: str
    expected_return_date: Optional[str] = None
    assignment_notes: Optional[str] = None
    assigned_to: str
    assigned_to_name: str
    assigned_by: Optional[str] = None
    assigned_by_name: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    checkout_condition: Optional[str] = None
    terms_accepted: Optional[bool] = False
    acceptance_signature: Optional[str] = None
    assignment_reason: Optional[str] = None
    department_id: Optional[str] = None
    entity_type: Optional[str] = None
    condition_at_assignment: Optional[str] = None
    
    # Added missing fields
    duration: Optional[int] = None
    duration_unit: Optional[str] = "days"
    bypass_policy: Optional[bool] = False
    bypass_policy_reason: Optional[str] = None
    
    # Aliases for frontend compatibility
    assigned_at: Optional[str] = None
    notes: Optional[str] = None
    due_date: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    
    model_config = model_config

class AssignmentReturn(BaseModel):
    assignment_id: str
    returned_date: str
    returned_to: Optional[str] = None
    returned_to_name: Optional[str] = None
    return_notes: Optional[str] = None
    condition_after: Optional[str] = None
    damage_details: Optional[str] = None
    return_signature: Optional[str] = None
    return_reason: Optional[str] = None
    checkin_condition: Optional[str] = None
    
    # Aliases for frontend compatibility
    unassigned_at: Optional[str] = None
    notes: Optional[str] = None
    
    model_config = model_config

class AssignmentUpdate(BaseModel):
    asset_id: Optional[str] = None
    asset_name: Optional[str] = None
    asset_tag: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    assignment_type: Optional[AssignmentType] = None
    status: Optional[AssignmentStatus] = None
    assigned_date: Optional[str] = None
    expected_return_date: Optional[str] = None
    actual_return_date: Optional[str] = None
    assignment_notes: Optional[str] = None
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_by: Optional[str] = None
    assigned_by_name: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    entity_type: Optional[str] = None
    returned_date: Optional[str] = None
    returned_to: Optional[str] = None
    returned_to_name: Optional[str] = None
    return_notes: Optional[str] = None
    condition_details: Optional[ConditionUpdate] = None
    condition_at_assignment: Optional[str] = None
    attachments: Optional[List[AssignmentAttachment]] = None
    terms_accepted: Optional[bool] = None
    acceptance_signature: Optional[str] = None
    return_signature: Optional[str] = None
    checkout_condition: Optional[str] = None
    checkin_condition: Optional[str] = None
    is_active: Optional[bool] = None
    
    # Aliases and additional frontend fields
    assignment_id: Optional[str] = None
    duration: Optional[int] = None
    assignment_reason: Optional[str] = None
    return_reason: Optional[str] = None
    due_date: Optional[str] = None
    extended_date: Optional[str] = None
    extension_reason: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    department_id: Optional[str] = None
    status_history: Optional[List[Dict[str, Any]]] = None
    assigned_at: Optional[str] = None
    unassigned_at: Optional[str] = None
    notes: Optional[str] = None
    current_assignee_id: Optional[str] = None
    current_assignee_name: Optional[str] = None
    
    model_config = model_config

class AssignmentResponse(BaseModel):
    id: str
    asset_id: str
    asset_name: str
    asset_tag: str
    assignment_type: str
    status: str
    assigned_date: str
    expected_return_date: Optional[str] = None
    assigned_to: str
    assigned_to_name: str
    department: Optional[str] = None
    entity_type: Optional[str] = None
    returned_date: Optional[str] = None
    is_active: Optional[bool] = None
    condition_at_assignment: Optional[str] = None
    
    # Aliases for frontend compatibility
    assigned_at: Optional[str] = None
    unassigned_at: Optional[str] = None
    notes: Optional[str] = None
    
    model_config = model_config