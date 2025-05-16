from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime
from .utils import (
    model_config,
    generate_category_id,
    generate_uuid,
    get_current_datetime
)

# Enum for Asset Status
class AssetStatus(str, Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    UNDER_MAINTENANCE = "under_maintenance"
    MAINTENANCE_REQUESTED = "maintenance_requested"
    MAINTENANCE_COMPLETED = "maintenance_completed"
    RETIRED = "retired"
    PENDING = "pending"
    LOST = "lost"

# Enum for Asset Condition
class AssetCondition(str, Enum):
    NEW = "new"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    EXCELLENT = "excellent"

# Enum for Maintenance Status
class MaintenanceStatus(str, Enum):
    REQUESTED = "requested"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Edit History Entry for AssetCategory
class EditHistoryEntry(BaseModel):
    id: str = Field(default_factory=generate_uuid, description="Unique identifier for the edit record")
    type: str = Field(..., description="Type of action, e.g., 'edit'")
    edit_date: str = Field(..., description="Date of the edit in YYYY-MM-DD format")
    change_type: str = Field(..., description="Type of change, e.g., 'Category Update'")
    details: str = Field(..., description="Details of the changes made")
    notes: str = Field(..., description="Notes about the edit")

    model_config = model_config

# Assignment Policies Schema - matching frontend naming
class AssignmentPolicies(BaseModel):
    max_assignments: Optional[int] = Field(1, description="Maximum number of assignments allowed")
    assignable_to: Optional[str] = Field(None, description="Type of entity assets can be assigned to")
    assignment_duration: Optional[int] = Field(None, description="Default duration for assignments")
    duration_unit: Optional[str] = Field(None, description="Unit for assignment duration, e.g., 'days'")
    allow_multiple_assignments: bool = Field(False, description="Indicates if multiple assignments are allowed")

    model_config = model_config

# Documents Schema - matching frontend naming
class Documents(BaseModel):
    purchase: bool = Field(False, description="Purchase document required")
    warranty: bool = Field(False, description="Warranty document required")
    insurance: bool = Field(False, description="Insurance document required")
    custom: List[str] = Field(default_factory=list, description="Custom document types")

    model_config = model_config

# Asset Category Schema
class AssetCategory(BaseModel):
    id: str = Field(default_factory=generate_category_id, description="Unique category ID")
    category_name: str = Field(..., description="Category name, e.g., 'Laptops'")
    category_type: Optional[str] = Field(None, description="Type, e.g., 'hardware', 'software', 'stationery'")
    description: Optional[str] = Field(None, description="Category description")
    policies: List[str] = Field(default_factory=list, description="List of policy statements")
    total_assets: int = Field(0, description="Total number of assets in the category")
    assigned_assets: int = Field(0, description="Number of assigned assets")
    under_maintenance: int = Field(0, description="Number of assets under maintenance")
    unassignable_assets: int = Field(0, description="Number of assets that cannot be assigned")
    total_cost: float = Field(0.0, description="Total cost of assets in the category")
    
    # Used in AssetTable/index.jsx
    name: Optional[str] = Field(None, description="Category name (alias for category_name)")
    in_storage: Optional[int] = Field(0, description="Number of items in storage")
    totalUnits: Optional[int] = Field(None, description="Total units in the category")
    totalCost: Optional[float] = Field(None, description="Total cost in the category")
    inStorage: Optional[int] = Field(None, description="Items in storage")
    
    # Assignment history fields
    assignment_history: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="History of assignments")
    
    # Edit history fields
    edit_history: List[EditHistoryEntry] = Field(default_factory=list, description="History of edits made to the category")
    
    # Fields matching the frontend AddAssetForm.jsx
    can_be_assigned_reassigned: bool = Field(False, description="Indicates if assets can be assigned and reassigned")
    is_consumable: bool = Field(False, description="Indicates if assets are consumable")
    is_allotted: bool = Field(False, description="Indicates if the category is allotted")
    maintenance_required: bool = Field(False, description="Indicates if maintenance is required")
    is_recurring_maintenance: bool = Field(False, description="Indicates if maintenance is recurring")
    maintenance_frequency: Optional[str] = Field(None, description="Frequency of maintenance, e.g., '1month'")
    alert_before_due: Optional[int] = Field(None, description="Days to alert before maintenance due")
    has_specifications: bool = Field(False, description="Indicates if specifications are required")
    specifications: List[Dict[str, str]] = Field(default_factory=list, description="List of specifications, e.g., [{'key': 'RAM', 'value': '16GB'}]")
    required_documents: bool = Field(False, description="Indicates if documents are required")
    documents: Optional[Union[Dict[str, Any], Documents]] = Field(None, description="Document requirements")
    cost_per_unit: Optional[float] = Field(None, description="Cost per unit of asset")
    expected_life: Optional[int] = Field(None, description="Expected life of assets")
    life_unit: Optional[str] = Field(None, description="Unit for expected life, e.g., 'years'")
    depreciation_method: Optional[str] = Field(None, description="Method of depreciation, e.g., 'straight_line'")
    residual_value: Optional[float] = Field(None, description="Residual value after depreciation")
    default_assignment_duration: Optional[int] = Field(None, description="Default duration for assignments")
    assignment_duration_unit: Optional[str] = Field(None, description="Unit for assignment duration, e.g., 'days'")
    can_be_assigned_to: Optional[str] = Field(None, description="Type of entity assets can be assigned to, e.g., 'single_employee'")
    allow_multiple_assignments: bool = Field(False, description="Indicates if multiple assignments are allowed")
    is_enabled: bool = Field(True, description="Indicates if the category is enabled")
    save_as_template: bool = Field(False, description="Indicates if the category should be saved as a template")
    
    # Fields matching the frontend EditAssetForm.jsx
    is_active: bool = Field(True, description="Indicates if the category is active")
    is_reassignable: bool = Field(True, description="Indicates if assets can be reassigned")
    requires_maintenance: bool = Field(False, description="Indicates if maintenance is required")
    maintenance_alert_days: Optional[int] = Field(None, description="Days to alert before maintenance due")
    assignment_policies: Optional[AssignmentPolicies] = Field(None, description="Assignment policies")
    
    # Make sure we have fields used in FilterBar and AllottedCategories
    is_allotable: bool = Field(False, description="Indicates if the category can be allotted")
    utilizationRate: Optional[float] = Field(None, description="Utilization rate of the category")
    
    # Fields from index.jsx and related components
    notes: Optional[str] = Field(None, description="Notes about the category")
    available_assets: Optional[int] = Field(None, description="Number of available assets")
    
    # History and timestamps
    created_at: datetime = Field(default_factory=get_current_datetime, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    model_config = model_config

class AssetCategoryCreate(BaseModel):
    category_name: str
    category_type: Optional[str] = None
    description: Optional[str] = None
    policies: List[str] = Field(default_factory=list)
    
    # AssetTable fields
    name: Optional[str] = None
    total_assets: Optional[int] = 0
    assigned_assets: Optional[int] = 0
    under_maintenance: Optional[int] = 0
    unassignable_assets: Optional[int] = 0
    total_cost: Optional[float] = 0.0
    
    # Fields matching the frontend AddAssetForm.jsx
    can_be_assigned_reassigned: bool = Field(False)
    is_consumable: bool = Field(False)
    is_allotted: bool = Field(False)
    maintenance_required: bool = Field(False)
    is_recurring_maintenance: bool = Field(False)
    maintenance_frequency: Optional[str] = None
    alert_before_due: Optional[int] = None
    has_specifications: bool = Field(False)
    specifications: List[Dict[str, str]] = Field(default_factory=list)
    required_documents: bool = Field(False)
    documents: Optional[Union[Dict[str, Any], Documents]] = None
    cost_per_unit: Optional[float] = None
    expected_life: Optional[int] = None
    life_unit: Optional[str] = None
    depreciation_method: Optional[str] = None
    residual_value: Optional[float] = None
    default_assignment_duration: Optional[int] = None
    assignment_duration_unit: Optional[str] = None
    can_be_assigned_to: Optional[str] = None
    allow_multiple_assignments: bool = Field(False)
    is_enabled: bool = Field(True)
    save_as_template: bool = Field(False)
    
    # Fields matching the frontend EditAssetForm.jsx
    is_active: bool = Field(True)
    is_reassignable: bool = Field(True)
    requires_maintenance: bool = Field(False)
    maintenance_alert_days: Optional[int] = None
    assignment_policies: Optional[AssignmentPolicies] = None
    
    # Additional frontend field
    is_allotable: bool = Field(False)
    notes: Optional[str] = None
    available_assets: Optional[int] = None
    
    model_config = model_config

class AssetCategoryUpdate(BaseModel):
    category_name: Optional[str] = None
    category_type: Optional[str] = None
    description: Optional[str] = None
    policies: Optional[List[str]] = None
    total_assets: Optional[int] = None
    assigned_assets: Optional[int] = None
    under_maintenance: Optional[int] = None
    unassignable_assets: Optional[int] = None
    total_cost: Optional[float] = None
    name: Optional[str] = None
    in_storage: Optional[int] = None
    can_be_assigned_reassigned: Optional[bool] = None
    is_consumable: Optional[bool] = None
    is_allotted: Optional[bool] = None
    maintenance_required: Optional[bool] = None
    is_recurring_maintenance: Optional[bool] = None
    maintenance_frequency: Optional[str] = None
    alert_before_due: Optional[int] = None
    has_specifications: Optional[bool] = None
    specifications: Optional[List[Dict[str, str]]] = None
    required_documents: Optional[bool] = None
    documents: Optional[Union[Dict[str, Any], Documents]] = None
    cost_per_unit: Optional[float] = None
    expected_life: Optional[int] = None
    life_unit: Optional[str] = None
    depreciation_method: Optional[str] = None
    residual_value: Optional[float] = None
    default_assignment_duration: Optional[int] = None
    assignment_duration_unit: Optional[str] = None
    can_be_assigned_to: Optional[str] = None
    allow_multiple_assignments: Optional[bool] = None
    is_enabled: Optional[bool] = None
    is_active: Optional[bool] = None
    is_reassignable: Optional[bool] = None
    requires_maintenance: Optional[bool] = None
    maintenance_alert_days: Optional[int] = None
    assignment_policies: Optional[AssignmentPolicies] = None
    is_allotable: Optional[bool] = None
    utilizationRate: Optional[float] = None
    notes: Optional[str] = None
    available_assets: Optional[int] = None
    totalUnits: Optional[int] = None
    totalCost: Optional[float] = None
    inStorage: Optional[int] = None
    
    model_config = model_config

# For AssetTablePage component
class AssetCategoryResponse(BaseModel):
    id: str
    category_name: str
    name: Optional[str] = None
    description: Optional[str] = None
    total_assets: int
    assigned_assets: int 
    under_maintenance: int
    unassignable_assets: int
    total_cost: float
    is_allotted: bool
    in_storage: Optional[int] = None
    utilizationRate: Optional[float] = None
    edit_history: Optional[List[Dict[str, Any]]] = None
    available_assets: Optional[int] = None
    notes: Optional[str] = None
    totalUnits: Optional[int] = None
    totalCost: Optional[float] = None
    inStorage: Optional[int] = None
    
    model_config = model_config