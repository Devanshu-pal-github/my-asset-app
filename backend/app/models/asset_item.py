from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class AssetItemBase(BaseModel):
    category_id: str
    name: str
    asset_tag: str
    serial_number: Optional[str] = None
    status: str
    condition: Optional[str] = "Good"
    assigned_to: Optional[str] = None
    department: Optional[str] = None
    specifications: Optional[Dict[str, str]] = {}
    purchase_cost: float
    current_value: Optional[float] = None
    purchase_date: datetime
    warranty_expiration: Optional[datetime] = None
    vendor: Optional[str] = None
    notes: Optional[str] = None

class AssetItemCreate(AssetItemBase):
    pass

class AssetItem(AssetItemBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True