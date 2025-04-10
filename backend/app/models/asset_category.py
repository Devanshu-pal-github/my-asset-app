from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AssetCategoryBase(BaseModel):
    name: str
    icon: Optional[str] = "pi pi-desktop"
    count: int = 0
    total_value: float = 0.0
    policies: Optional[List[str]] = []

class AssetCategoryCreate(AssetCategoryBase):
    pass

class AssetCategory(AssetCategoryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True