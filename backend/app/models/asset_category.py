from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from bson import ObjectId

class AssetCategory(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Unique category ID")
    name: str = Field(..., description="Category name, e.g., 'Laptops'")
    icon: Optional[str] = Field(None, description="Icon for UI, e.g., 'pi pi-desktop'")
    count: int = Field(0, description="Number of assets in category")
    total_value: float = Field(0.0, description="Total value of assets")
    policies: List[str] = Field(default_factory=list, description="Policies or rules")
    is_active: int = Field(1, description="1 if active, 0 if inactive")
    category_type: Optional[str] = Field(None, description="Type, e.g., 'Hardware'")
    description: Optional[str] = Field(None, description="Category description")
    status: Optional[str] = Field(None, description="Category status")
    is_reassignable: int = Field(0, description="1 if assets can be reassigned")
    is_consumable: int = Field(0, description="1 if assets are consumable")
    requires_maintenance: int = Field(0, description="1 if maintenance required")
    maintenance_frequency: Optional[str] = Field(None, description="Frequency, e.g., '3 months'")
    maintenance_alert_days: Optional[int] = Field(None, description="Days to alert before maintenance")
    cost_per_unit: Optional[float] = Field(None, description="Cost per asset unit")
    expected_life: Optional[int] = Field(None, description="Expected life in life_unit")
    life_unit: Optional[str] = Field(None, description="Unit for expected_life, e.g., 'Years'")
    depreciation_method: Optional[str] = Field(None, description="Method, e.g., 'Straight Line'")
    residual_value: Optional[float] = Field(None, description="Residual value after depreciation")
    assignment_duration: Optional[int] = Field(None, description="Default assignment duration")
    duration_unit: Optional[str] = Field(None, description="Unit for assignment_duration, e.g., 'Days'")
    assignable_to: Optional[str] = Field(None, description="Entity type, e.g., 'Employee'")
    allow_multiple_assignments: int = Field(0, description="1 if multiple assignments allowed")
    save_as_template: int = Field(0, description="1 if saved as template")
    specifications: Optional[Dict[str, str]] = Field(None, description="Default specifications")
    assigned_count: int = Field(0, description="Number of assigned assets")
    maintenance_count: int = Field(0, description="Number of assets under maintenance")
    utilization_rate: float = Field(0.0, description="Utilization rate percentage")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AssetCategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    category_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    is_reassignable: int = 0
    is_consumable: int = 0
    requires_maintenance: int = 0
    maintenance_frequency: Optional[str] = None
    maintenance_alert_days: Optional[int] = None
    cost_per_unit: Optional[float] = None
    expected_life: Optional[int] = None
    life_unit: Optional[str] = None
    depreciation_method: Optional[str] = None
    residual_value: Optional[float] = None
    assignment_duration: Optional[int] = None
    duration_unit: Optional[str] = None
    assignable_to: Optional[str] = None
    allow_multiple_assignments: int = 0
    save_as_template: int = 0
    specifications: Optional[Dict[str, str]] = None

    class Config:
        arbitrary_types_allowed = True