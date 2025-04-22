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
    description: Optional[str] = None   # Existing field, will be replaced by category_type in UI
    category_type: Optional[str] = None  # New field for category type (e.g., "Hardware", "Software")
    status: Optional[str] = None        # Existing field
    specifications: Optional[Dict[str, str]] = None  # Existing field
    is_reassignable: Optional[int] = None  # Existing field
    is_consumable: Optional[int] = None  # Existing field
    requires_maintenance: Optional[int] = None  # Existing field
    maintenance_frequency: Optional[str] = None  # Existing field
    maintenance_alert_days: Optional[int] = None  # Existing field
    cost_per_unit: Optional[float] = None  # Existing field
    expected_life: Optional[int] = None  # Existing field
    life_unit: Optional[str] = None  # Existing field
    depreciation_method: Optional[str] = None  # Existing field
    residual_value: Optional[float] = None  # Existing field
    assignment_duration: Optional[int] = None  # Existing field
    duration_unit: Optional[str] = None  # Existing field
    assignable_to: Optional[str] = None  # Existing field
    allow_multiple_assignments: Optional[int] = None  # Existing field
    save_as_template: Optional[int] = None  # Existing field

class AssetCategoryCreate(AssetCategoryBase):
    pass

class AssetCategory(AssetCategoryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True