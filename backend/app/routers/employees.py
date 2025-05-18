from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from pymongo.database import Database
from typing import List, Optional
from app.dependencies import get_employees_collection
from app.models.employee import Employee, EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.models.asset_item import AssetItem
from app.models.assignment_history import AssignmentResponse
from app.models.maintenance_history import MaintenanceResponse
from app.models.document import DocumentResponse
from app.services.employee_service import (
    create_employee,
    get_employees,
    get_employee_by_id,
    get_employee_details,
    update_employee,
    delete_employee
)
import logging

logger = logging.getLogger(__name__)

class EmployeeDetailsResponse(BaseModel):
    employee: Employee
    current_assets: List[AssetItem]
    assignment_history: List[AssignmentResponse]
    maintenance_history: List[MaintenanceResponse]
    documents: List[DocumentResponse]

router = APIRouter(prefix="/employees", tags=["Employees"])

@router.get("/", response_model=List[EmployeeResponse])
async def read_employees(
    department: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    collection: Database = Depends(get_employees_collection)
):
    """
    Retrieve all employees with optional filters for department or role.
    
    Args:
        department (Optional[str]): Filter by department
        role (Optional[str]): Filter by role
        is_active (Optional[bool]): Filter by active status
        collection (Database): MongoDB collection instance, injected via dependency
        
    Returns:
        List[EmployeeResponse]: List of employees matching the filters
        
    Raises:
        HTTPException: 500 for server errors
    """
    logger.info(f"Fetching employees - department: {department}, role: {role}, is_active: {is_active}")
    try:
        filters = {}
        if department:
            filters["department"] = department
        if role:
            filters["role"] = role
        if is_active is not None:
            filters["is_active"] = is_active
            
        employees = get_employees(collection, filters)
        logger.debug(f"Fetched {len(employees)} employees")
        return employees
    except Exception as e:
        logger.error(f"Failed to fetch employees: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch employees: {str(e)}")

@router.get("/{employee_id}", response_model=Employee)
async def read_employee(employee_id: str, collection: Database = Depends(get_employees_collection)):
    """
    Retrieve a specific employee by ID.
    
    Args:
        employee_id (str): Employee ID
        collection (Database): MongoDB collection instance, injected via dependency
        
    Returns:
        Employee: Employee details
        
    Raises:
        HTTPException: 404 if employee not found, 400 for invalid ID, 500 for server errors
    """
    logger.info(f"Fetching employee with ID: {employee_id}")
    try:
        employee = get_employee_by_id(collection, employee_id)
        if not employee:
            logger.warning(f"Employee not found: {employee_id}")
            raise HTTPException(status_code=404, detail="Employee not found")
            
        logger.debug(f"Found employee: {employee.employee_id}")
        return employee
    except ValueError as ve:
        logger.warning(f"Invalid employee ID: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to fetch employee {employee_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee: {str(e)}")

@router.get("/{employee_id}/details", response_model=EmployeeDetailsResponse)
async def read_employee_details(employee_id: str, collection: Database = Depends(get_employees_collection)):
    """
    Retrieve detailed employee information including current assets, assignment history, maintenance history, and documents.
    
    Args:
        employee_id (str): Employee ID
        collection (Database): MongoDB collection instance, injected via dependency
        
    Returns:
        EmployeeDetailsResponse: Detailed employee information
        
    Raises:
        HTTPException: 404 if employee not found, 400 for invalid ID, 500 for server errors
    """
    logger.info(f"Fetching employee details for ID: {employee_id}")
    try:
        details = get_employee_details(collection, employee_id)
        if not details:
            logger.warning(f"Employee not found: {employee_id}")
            raise HTTPException(status_code=404, detail="Employee not found")
        
        employee = Employee(**details["employee"])
        current_assets = [AssetItem(**asset) for asset in details["current_assets"]]
        assignment_history = [AssignmentResponse(**entry) for entry in details["assignment_history"]]
        maintenance_history = [MaintenanceResponse(**entry) for entry in details["maintenance_history"]]
        documents = [DocumentResponse(**doc) for doc in details["documents"]]
        
        response = EmployeeDetailsResponse(
            employee=employee,
            current_assets=current_assets,
            assignment_history=assignment_history,
            maintenance_history=maintenance_history,
            documents=documents
        )
        
        logger.debug(f"Fetched employee details for ID: {employee_id}")
        return response
    except ValueError as ve:
        logger.warning(f"Invalid employee ID: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to fetch employee details {employee_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee details: {str(e)}")

@router.post("/", response_model=EmployeeResponse)
async def create_new_employee(employee: EmployeeCreate, collection: Database = Depends(get_employees_collection)):
    """
    Create a new employee.
    
    Args:
        employee (EmployeeCreate): Employee details
        collection (Database): MongoDB collection instance, injected via dependency
        
    Returns:
        EmployeeResponse: Created employee details
        
    Raises:
        HTTPException: 400 for validation errors, 500 for server errors
    """
    logger.info(f"Creating employee: {employee.employee_id}")
    try:
        created_employee = create_employee(collection, employee)
        logger.debug(f"Created employee with ID: {created_employee.id}")
        return created_employee
    except ValueError as ve:
        logger.warning(f"Failed to create employee: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to create employee: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create employee: {str(e)}")

@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_existing_employee(employee_id: str, employee: EmployeeUpdate, collection: Database = Depends(get_employees_collection)):
    """
    Update an existing employee.
    
    Args:
        employee_id (str): Employee ID to update
        employee (EmployeeUpdate): Updated employee details
        collection (Database): MongoDB collection instance, injected via dependency
        
    Returns:
        EmployeeResponse: Updated employee details
        
    Raises:
        HTTPException: 404 if employee not found, 400 for validation errors, 500 for server errors
    """
    logger.info(f"Updating employee with ID: {employee_id}")
    try:
        updated_employee = update_employee(collection, employee_id, employee)
        if not updated_employee:
            logger.warning(f"Employee not found: {employee_id}")
            raise HTTPException(status_code=404, detail="Employee not found")
            
        logger.debug(f"Updated employee: {updated_employee.employee_id}")
        return updated_employee
    except ValueError as ve:
        logger.warning(f"Failed to update employee: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to update employee {employee_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update employee: {str(e)}")

@router.delete("/{employee_id}", response_model=dict)
async def delete_existing_employee(employee_id: str, collection: Database = Depends(get_employees_collection)):
    """
    Delete an employee if no assets are assigned.
    
    Args:
        employee_id (str): Employee ID to delete
        collection (Database): MongoDB collection instance, injected via dependency
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 404 if employee not found, 400 if employee has assets, 500 for server errors
    """
    logger.info(f"Deleting employee with ID: {employee_id}")
    try:
        deleted = delete_employee(collection, employee_id)
        if not deleted:
            logger.warning(f"Employee not found: {employee_id}")
            raise HTTPException(status_code=404, detail="Employee not found")
            
        logger.debug(f"Deleted employee ID: {employee_id}")
        return {"message": "Employee deleted successfully"}
    except ValueError as ve:
        logger.warning(f"Cannot delete employee: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to delete employee {employee_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete employee: {str(e)}")