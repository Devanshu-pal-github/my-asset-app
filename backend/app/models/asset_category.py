from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum
from datetime import datetime
from bson import ObjectId

# Enum for Asset Status
class AssetStatus(str, Enum):
    AVAILABLE = "available"
    ASSIGNED = "Assigned"
    UNDER_MAINTENANCE = "under_maintenance"
    MAINTENANCE_REQUESTED = "maintenance_requested"
    MAINTENANCE_COMPLETED = "maintenance_completed"
    RETIRED = "retired"
    PENDING = "Pending"
    LOST = "lost"

# Enum for Asset Condition
class AssetCondition(str, Enum):
    NEW = "new"
    GOOD = "Good"
    FAIR = "fair"
    POOR = "poor"
    EXCELLENT = "Excellent"

# Enum for Maintenance Status
class MaintenanceStatus(str, Enum):
    REQUESTED = "Requested"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

# Edit History Entry for AssetCategory
class EditHistoryEntry(BaseModel):
    id: str = Field(..., description="Unique identifier for the edit record")
    type: str = Field(..., description="Type of action, e.g., 'edit'")
    edit_date: str = Field(..., description="Date of the edit in YYYY-MM-DD format")
    change_type: str = Field(..., description="Type of change, e.g., 'Category Update'")
    details: str = Field(..., description="Details of the changes made")
    notes: str = Field(..., description="Notes about the edit")

    class Config:
        arbitrary_types_allowed = True

# Asset Category Schema
class AssetCategory(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique category ID")
    category_name: str = Field(..., description="Category name, e.g., 'Laptops'")
    category_type: Optional[str] = Field(None, description="Type, e.g., 'hardware', 'stationery'")
    description: Optional[str] = Field(None, description="Category description")
    policies: List[str] = Field(default_factory=list, description="List of policy statements")
    total_assets: int = Field(0, description="Total number of assets in the category")
    assigned_assets: int = Field(0, description="Number of assigned assets")
    under_maintenance: int = Field(0, description="Number of assets under maintenance")
    unassignable_assets: int = Field(0, description="Number of assets that cannot be assigned")
    total_cost: float = Field(0.0, description="Total cost of assets in the category")
    is_allotted: bool = Field(False, description="Indicates if the category is allotted")
    can_be_assigned_reassigned: bool = Field(False, description="Indicates if assets can be assigned and reassigned")
    is_consumable: bool = Field(False, description="Indicates if assets are consumable")
    maintenance_required: bool = Field(False, description="Indicates if maintenance is required")
    is_recurring_maintenance: bool = Field(False, description="Indicates if maintenance is recurring")
    maintenance_frequency: Optional[str] = Field(None, description="Frequency of maintenance, e.g., '1month'")
    alert_before_due: Optional[int] = Field(None, description="Days to alert before maintenance due")
    has_specifications: bool = Field(False, description="Indicates if specifications are required")
    specifications: List[Dict[str, str]] = Field(default_factory=list, description="List of specifications, e.g., [{'key': 'RAM', 'value': '16GB'}]")
    required_documents: bool = Field(False, description="Indicates if documents are required")
    documents: Optional[Dict[str, object]] = Field(None, description="Document requirements, e.g., {'purchase': true, 'warranty': true, 'custom': ['manual']}")
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
    is_active: bool = Field(True, description="Indicates if the category is active")
    max_assignments: Optional[int] = Field(None, description="Maximum number of assignments allowed")
    edit_history: List[EditHistoryEntry] = Field(default_factory=list, description="History of edits made to the category")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        populate_by_name = True

class AssetCategoryCreate(BaseModel):
    category_name: str
    category_type: Optional[str] = None
    description: Optional[str] = None
    policies: List[str] = Field(default_factory=list)
    is_allotted: bool = Field(False)
    can_be_assigned_reassigned: bool = Field(False)
    is_consumable: bool = Field(False)
    maintenance_required: bool = Field(False)
    is_recurring_maintenance: bool = Field(False)
    maintenance_frequency: Optional[str] = None
    alert_before_due: Optional[int] = None
    has_specifications: bool = Field(False)
    specifications: List[Dict[str, str]] = Field(default_factory=list)
    required_documents: bool = Field(False)
    documents: Optional[Dict[str, object]] = None
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
    is_active: bool = Field(True)
    max_assignments: Optional[int] = None

    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True