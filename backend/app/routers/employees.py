from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from pymongo.database import Database
from typing import List, Optional
from app.dependencies import get_db
from app.models.employee import Employee, EmployeeCreate
from app.models.asset_item import AssetItem
from app.models.document import DocumentEntry
from app.services.employee_service import (
    create_employee,
    get_employees,
    get_employee_by_id,
    update_employee,
    delete_employee,
    get_employee_details,
    get_employee_statistics
)
import logging

logger = logging.getLogger(__name__)

class EmployeeDetailsResponse(BaseModel):
    employee: Employee
    assets: List[AssetItem]
    documents: List[DocumentEntry]

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("/", response_model=List[Employee])
async def read_employees(
    department: Optional[str] = None,
    role: Optional[str] = None,
    db: Database = Depends(get_db)
):
    """
    Retrieve all employees with optional filters for department or role.
    """
    logger.info(f"Fetching employees - department: {department}, role: {role}")
    try:
        query = {}
        if department:
            query["department"] = department
        if role:
            query["role"] = role
        employees = get_employees(db)
        filtered_employees = [emp for emp in employees if all(emp.dict().get(k) == v for k, v in query.items())]
        logger.debug(f"Fetched {len(filtered_employees)} employees: {[emp.employee_id for emp in filtered_employees]}")
        return filtered_employees
    except Exception as e:
        logger.error(f"Failed to fetch employees: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch employees: {str(e)}")

@router.get("/statistics", response_model=dict)
async def read_employee_statistics(db: Database = Depends(get_db)):
    """
    Retrieve statistics for employees (total, with assets, without assets).
    """
    logger.info("Fetching employee statistics")
    try:
        stats = get_employee_statistics(db)
        logger.debug(f"Employee statistics: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Failed to fetch employee statistics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee statistics: {str(e)}")

@router.get("/{id}", response_model=Employee)
async def read_employee(id: str, db: Database = Depends(get_db)):
    """
    Retrieve a specific employee by ID.
    """
    logger.info(f"Fetching employee with ID: {id}")
    try:
        employee = get_employee_by_id(db, id)
        if not employee:
            logger.warning(f"Employee not found: {id}")
            raise HTTPException(status_code=404, detail="Employee not found")
        logger.debug(f"Found employee: {employee.name}")
        return employee
    except ValueError as ve:
        logger.warning(f"Invalid employee ID: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to fetch employee {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee: {str(e)}")

@router.get("/{id}/details", response_model=EmployeeDetailsResponse)
async def read_employee_details(id: str, db: Database = Depends(get_db)):
    """
    Retrieve detailed employee information including assets, history, and documents.
    """
    logger.info(f"Fetching employee details for ID: {id}")
    try:
        details = get_employee_details(db, id)
        logger.debug(f"Fetched employee details for ID: {id}")
        return details
    except ValueError as ve:
        logger.warning(f"Invalid employee ID or not found: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to fetch employee details {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee details: {str(e)}")

@router.post("/", response_model=Employee)
async def create_new_employee(employee: EmployeeCreate, db: Database = Depends(get_db)):
    """
    Create a new employee.
    """
    logger.info(f"Creating employee: {employee.name}")
    try:
        created_employee = create_employee(db, employee)
        logger.debug(f"Created employee with ID: {created_employee.id}")
        return created_employee
    except ValueError as ve:
        logger.warning(f"Failed to create employee: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to create employee: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create employee: {str(e)}")

@router.put("/{id}", response_model=Employee)
async def update_existing_employee(id: str, employee: EmployeeCreate, db: Database = Depends(get_db)):
    """
    Update an existing employee.
    """
    logger.info(f"Updating employee with ID: {id}")
    try:
        updated_employee = update_employee(db, id, employee)
        if not updated_employee:
            logger.warning(f"Employee not found: {id}")
            raise HTTPException(status_code=404, detail="Employee not found")
        logger.debug(f"Updated employee: {updated_employee.name}")
        return updated_employee
    except ValueError as ve:
        logger.warning(f"Failed to update employee: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to update employee {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update employee: {str(e)}")

@router.delete("/{id}", response_model=dict)
async def delete_existing_employee(id: str, db: Database = Depends(get_db)):
    """
    Delete an employee if no assets are assigned.
    """
    logger.info(f"Deleting employee with ID: {id}")
    try:
        deleted = delete_employee(db, id)
        if not deleted:
            logger.warning(f"Employee not found: {id}")
            raise HTTPException(status_code=404, detail="Employee not found")
        logger.debug(f"Deleted employee ID: {id}")
        return {"message": "Employee deleted successfully"}
    except ValueError as ve:
        logger.warning(f"Cannot delete employee: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to delete employee {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete employee: {str(e)}")