from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import db
from app.models.employee import Employee, EmployeeCreate, EmployeeBase
from app.services.employee_service import create_employee, get_employees, get_employee_by_id, update_employee, delete_employee, get_employee_details
from typing import List
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("/", response_model=List[Employee])
def read_employees():
    try:
        logger.debug("Fetching all employees via router")
        employees = get_employees(db)
        logger.debug(f"Returning {len(employees)} employees")
        return employees
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch employees in router: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch employees: {str(e)}")

@router.get("/{id}", response_model=Employee)
def read_employee(id: str):
    try:
        logger.debug(f"Fetching employee ID: {id} via router")
        employee = get_employee_by_id(db, id)
        if not employee:
            logger.warning(f"Employee not found for ID: {id}")
            raise HTTPException(status_code=404, detail="Employee not found")
        logger.debug(f"Returning employee: {employee.employee_id}")
        return employee
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch employee ID {id} in router: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee: {str(e)}")

@router.get("/{id}/details", response_model=dict)
def read_employee_details(id: str):
    try:
        logger.debug(f"Fetching employee details for ID: {id} via router")
        details = get_employee_details(db, id)
        logger.debug(f"Returning employee details for ID: {id}")
        return details
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch employee details for ID {id} in router: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee details: {str(e)}")

@router.post("/", response_model=Employee)
def create_new_employee(employee: EmployeeCreate):
    try:
        logger.debug("Creating new employee via router")
        result = create_employee(db, employee)
        logger.debug(f"Created employee: {result.employee_id}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create employee in router: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create employee: {str(e)}")

@router.put("/{id}", response_model=Employee)
def update_employee_route(id: str, employee: EmployeeBase):
    try:
        logger.debug(f"Updating employee ID: {id} via router")
        updated_employee = update_employee(db, id, employee)
        if not updated_employee:
            logger.warning(f"Employee not found or no changes made for ID: {id}")
            raise HTTPException(status_code=404, detail="Employee not found or no changes made")
        logger.debug(f"Updated employee: {updated_employee.employee_id}")
        return updated_employee
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update employee ID {id} in router: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update employee: {str(e)}")

@router.delete("/{id}", response_model=dict)
def delete_employee_route(id: str):
    try:
        logger.debug(f"Deleting employee ID: {id} via router")
        deleted = delete_employee(db, id)
        if not deleted:
            logger.warning(f"Employee not found for deletion: {id}")
            raise HTTPException(status_code=404, detail="Employee not found")
        logger.debug(f"Deleted employee ID: {id}")
        return {"message": "Employee deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete employee ID {id} in router: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete employee: {str(e)}")