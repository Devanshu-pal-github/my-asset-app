from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentBase(BaseModel):
    asset_id: str
    type: str
    filename: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    description: Optional[str] = None
    uploaded_by: Optional[str] = None
    upload_date: datetime
    expiry_date: Optional[datetime] = None
    is_active: int = 1

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True