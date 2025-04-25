from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import db
from app.models.employee import Employee, EmployeeCreate, EmployeeBase
from app.services.employee_service import create_employee, get_employees, get_employee_by_id, update_employee, delete_employee
from typing import List
from bson import ObjectId

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("/", response_model=List[Employee])
def read_employees():
    try:
        employees = []
        # Join with asset_items to get asset names
        pipeline = [
            {
                "$lookup": {
                    "from": "asset_items",
                    "localField": "assigned_assets.asset_id",
                    "foreignField": "_id",
                    "as": "asset_details"
                }
            },
            {
                "$addFields": {
                    "assigned_assets": {
                        "$map": {
                            "input": "$assigned_assets",
                            "as": "asset",
                            "in": {
                                "asset_id": "$$asset.asset_id",
                                "name": {
                                    "$arrayElemAt": [
                                        {
                                            "$ifNull": ["$asset_details.name", "Unknown Asset"]
                                        },
                                        {
                                            "$indexOfArray": [
                                                "$asset_details._id",
                                                {"$toObjectId": "$$asset.asset_id"}
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                "$unset": "asset_details"
            }
        ]
        
        for employee in db.employees.aggregate(pipeline):
            employee['id'] = str(employee['_id'])
            employees.append(Employee(**employee))
        return employees
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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