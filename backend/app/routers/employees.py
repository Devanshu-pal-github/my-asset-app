from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import db
from app.models.employee import Employee, EmployeeCreate, EmployeeBase
from app.services.employee_service import create_employee, get_employees, get_employee_by_id, update_employee, delete_employee
from typing import List

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("/", response_model=List[Employee])
def read_employees():
    return get_employees(db)

@router.get("/{id}", response_model=Employee)
def read_employee(id: str):
    employee = get_employee_by_id(db, id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.post("/", response_model=Employee)
def create_new_employee(employee: EmployeeCreate):
    return create_employee(db, employee)

@router.put("/{id}", response_model=Employee)
def update_employee_route(id: str, employee: EmployeeBase):
    updated_employee = update_employee(db, id, employee)
    if not updated_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return updated_employee

@router.delete("/{id}", response_model=dict)
def delete_employee_route(id: str):
    deleted = delete_employee(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted successfully"}