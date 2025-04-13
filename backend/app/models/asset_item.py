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
    category_id: str
    name: str
    asset_tag: str
    serial_number: Optional[str] = None
    status: AssetStatus = AssetStatus.AVAILABLE
    condition: AssetCondition = AssetCondition.GOOD
    assigned_to: Optional[str] = None
    is_assigned: int = 0
    is_active: int = 1
    department: Optional[str] = None
    location: Optional[str] = None
    specifications: Optional[Dict[str, str]] = {}
    purchase_cost: float
    current_value: Optional[float] = None
    purchase_date: datetime
    warranty_expiration: Optional[datetime] = None
    vendor: Optional[str] = None
    insurance_policy: Optional[str] = None
    disposal_date: Optional[datetime] = None
    notes: Optional[str] = None

class AssetItemCreate(AssetItemBase):
    pass

class AssetItem(AssetItemBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True