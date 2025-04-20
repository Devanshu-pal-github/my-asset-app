from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime
from enum import Enum

class AssetStatus(str, Enum):
    IN_USE = "In Use"
    UNDER_MAINTENANCE = "Under Maintenance"
    RETIRED = "Retired"
    AVAILABLE = "Available"
    LOST = "Lost"

class AssetCondition(str, Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"
    BROKEN = "Broken"

class AssetItemBase(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = None
    asset_tag: Optional[str] = None
    serial_number: Optional[str] = None
    status: Optional[AssetStatus] = AssetStatus.AVAILABLE
    condition: Optional[AssetCondition] = AssetCondition.GOOD
    current_assignee_id: Optional[str] = None
    has_active_assignment: Optional[int] = 0
    is_operational: Optional[int] = 1
    department: Optional[str] = None
    location: Optional[str] = None
    specifications: Optional[Dict[str, str]] = {}
    purchase_cost: Optional[float] = None
    current_value: Optional[float] = None
    purchase_date: Optional[datetime] = None
    warranty_expiration: Optional[datetime] = None
    vendor: Optional[str] = None
    insurance_policy: Optional[str] = None
    disposal_date: Optional[datetime] = None
    notes: Optional[str] = None
    current_assignment_date: Optional[datetime] = None

class AssetItemCreate(AssetItemBase):
    category_id: str
    name: str
    asset_tag: str
    purchase_cost: float
    purchase_date: datetime

class AssetItem(AssetItemBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True