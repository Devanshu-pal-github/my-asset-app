from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentBase(BaseModel):
    asset_id: Optional[str] = None
    employee_id: Optional[str] = None
    document_type: Optional[str] = None
    document_url: Optional[str] = None
    document_name: Optional[str] = None
    notes: Optional[str] = None
    uploaded_by: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True