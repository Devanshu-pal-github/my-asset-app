from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .asset_item import AssetCondition

class MaintenanceHistoryBase(BaseModel):
    asset_id: str
    maintenance_type: str
    technician: str
    condition_before: AssetCondition
    condition_after: Optional[AssetCondition] = None
    maintenance_date: datetime
    completed_date: Optional[datetime] = None
    is_completed: int = 0
    cost: float
    notes: Optional[str] = None

class MaintenanceHistoryCreate(MaintenanceHistoryBase):
    pass

class MaintenanceHistory(MaintenanceHistoryBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True