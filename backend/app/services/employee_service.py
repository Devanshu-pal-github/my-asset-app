from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError
from app.models.employee import EmployeeCreate, Employee, EmployeeBase
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
from fastapi import HTTPException

def get_employees(db: Collection) -> List[Employee]:
    employees = list(db.employees.find())
    return [Employee(**{**emp, "id": str(emp["_id"])}) for emp in employees]

def get_employee_by_id(db: Collection, id: str) -> Optional[Employee]:
    try:
        employee = db.employees.find_one({"_id": ObjectId(id)})
        if employee:
            return Employee(**{**employee, "id": str(employee["_id"])})
        return None
    except:
        return None

def create_employee(db: Collection, employee: EmployeeCreate) -> Employee:
    employee_dict = employee.dict()
    employee_dict["created_at"] = datetime.utcnow()
    employee_dict["updated_at"] = datetime.utcnow()
    try:
        result = db.employees.insert_one(employee_dict)
        return Employee(**{**employee_dict, "id": str(result.inserted_id)})
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Employee ID already exists")

def update_employee(db: Collection, id: str, employee: EmployeeBase) -> Optional[Employee]:
    try:
        update_data = employee.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        result = db.employees.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )
        if result.modified_count == 0:
            return None
        updated_employee = db.employees.find_one({"_id": ObjectId(id)})
        return Employee(**{**updated_employee, "id": str(updated_employee["_id"])})
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    except:
        return None

def delete_employee(db: Collection, id: str) -> bool:
    try:
        employee = db.employees.find_one({"_id": ObjectId(id)})
        if employee and employee.get("assigned_assets", []):
            raise ValueError("Cannot delete employee with assigned assets")
        result = db.employees.delete_one({"_id": ObjectId(id)})
        return result.deleted_count > 0
    except:
        return False