from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AssignmentHistoryBase(BaseModel):
    asset_id: Optional[str] = None
    assigned_to: List[str] = []
    department: Optional[str] = None
    condition: Optional[str] = None
    assignment_date: Optional[datetime] = None
    return_date: Optional[datetime] = None
    is_active: Optional[int] = 1
    notes: Optional[str] = None

class AssignmentHistoryCreate(AssignmentHistoryBase):
    asset_id: str
    assigned_to: List[str]
    assignment_date: datetime
    condition: str

class AssignmentHistory(AssignmentHistoryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True