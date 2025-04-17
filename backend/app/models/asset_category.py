from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class AssetCategoryBase(BaseModel):
    name: str
    icon: Optional[str] = "pi pi-desktop"
    count: int = 0
    total_value: float = 0.0
    policies: Optional[List[str]] = []  # Retain for existing logic
    is_active: int = 1
    description: Optional[str] = None   # New field for description
    status: Optional[str] = None        # New field for default status
    specifications: Optional[Dict[str, str]] = None  # New field for specs
    is_reassignable: Optional[int] = None  # New field for canReassign
    is_consumable: Optional[int] = None  # New field for isConsumable
    requires_maintenance: Optional[int] = None  # New field
    maintenance_frequency: Optional[str] = None  # New field
    maintenance_alert_days: Optional[int] = None  # New field
    cost_per_unit: Optional[float] = None  # New field
    expected_life: Optional[int] = None  # New field
    life_unit: Optional[str] = None  # New field
    depreciation_method: Optional[str] = None  # New field
    residual_value: Optional[float] = None  # New field
    assignment_duration: Optional[int] = None  # New field
    duration_unit: Optional[str] = None  # New field
    assignable_to: Optional[str] = None  # New field
    allow_multiple_assignments: Optional[int] = None  # New field
    save_as_template: Optional[int] = None  # New field

class AssetCategoryCreate(AssetCategoryBase):
    pass

class AssetCategory(AssetCategoryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True