from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class EmployeeBase(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    email: EmailStr
    department: str
    job_title: Optional[str] = None
    phone: Optional[str] = None
    is_active: int = 1
    assigned_assets: List[str] = []

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True