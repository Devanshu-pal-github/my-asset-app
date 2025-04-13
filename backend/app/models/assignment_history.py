from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .asset_item import AssetCondition

class AssignmentHistoryBase(BaseModel):
    asset_id: str
    assigned_to: str
    department: Optional[str] = None
    condition: AssetCondition
    assignment_date: datetime
    return_date: Optional[datetime] = None
    is_active: int = 1
    notes: Optional[str] = None

class AssignmentHistoryCreate(AssignmentHistoryBase):
    pass

class AssignmentHistory(AssignmentHistoryBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True