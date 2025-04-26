from pymongo.database import Database
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from app.models.employee import Employee, EmployeeCreate
from app.models.asset_item import AssetItem
from app.models.document import DocumentEntry
import logging

logger = logging.getLogger(__name__)

def get_employees(db: Database) -> List[Employee]:
    """
    Retrieve all employees.
    """
    logger.info("Fetching all employees")
    try:
        employees = list(db.employees.find())
        result = [Employee(**{**emp, "id": str(emp["_id"])}) for emp in employees]
        logger.debug(f"Fetched {len(result)} employees")
        return result
    except Exception as e:
        logger.error(f"Error fetching employees: {str(e)}", exc_info=True)
        raise

def get_employee_by_id(db: Database, id: str) -> Optional[Employee]:
    """
    Retrieve a specific employee by ID.
    """
    logger.info(f"Fetching employee ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid employee ID")
        
        emp = db.employees.find_one({"_id": ObjectId(id)})
        if not emp:
            logger.warning(f"Employee not found: {id}")
            return None
        
        employee = Employee(**{**emp, "id": str(emp["_id"])})
        logger.debug(f"Fetched employee: {employee.name}")
        return employee
    except Exception as e:
        logger.error(f"Error fetching employee {id}: {str(e)}", exc_info=True)
        raise

def get_employee_statistics(db: Database) -> dict:
    """
    Calculate employee-related statistics for dashboard.
    """
    logger.info("Calculating employee statistics")
    try:
        total_employees = db.employees.count_documents({})
        employees_with_assets = db.employees.count_documents({"assigned_assets.0": {"$exists": True}})
        employees_without_assets = total_employees - employees_with_assets
        
        stats = {
            "total_employees": total_employees,
            "employees_with_assets": employees_with_assets,
            "employees_without_assets": employees_without_assets
        }
        logger.debug(f"Employee statistics calculated: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Error calculating employee statistics: {str(e)}", exc_info=True)
        raise

def get_employee_details(db: Database, id: str) -> dict:
    """
    Retrieve detailed employee information using aggregation.
    """
    logger.info(f"Fetching employee details for ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid employee ID")
        
        pipeline = [
            {"$match": {"_id": ObjectId(id)}},
            {
                "$lookup": {
                    "from": "asset_items",
                    "localField": "assigned_assets.asset_id",
                    "foreignField": "_id",
                    "as": "assets"
                }
            },
            {
                "$lookup": {
                    "from": "documents",
                    "localField": "_id",
                    "foreignField": "employee_id",
                    "as": "documents"
                }
            }
        ]
        result = list(db.employees.aggregate(pipeline))
        if not result:
            logger.warning(f"Employee not found: {id}")
            raise ValueError("Employee not found")
        
        emp = result[0]
        details = {
            "employee": Employee(**{**emp, "id": str(emp["_id"])}),
            "assets": [
                AssetItem(**{**asset, "id": str(asset["_id"])})
                for asset in emp["assets"]
            ],
            "documents": [DocumentEntry(**{**doc, "id": str(doc["_id"])}) for doc in emp["documents"]]
        }
        logger.debug(f"Fetched employee details for ID: {id}")
        return details
    except Exception as e:
        logger.error(f"Error fetching employee details {id}: {str(e)}", exc_info=True)
        raise

def create_employee(db: Database, employee: EmployeeCreate) -> Employee:
    """
    Create a new employee with validation.
    """
    logger.info(f"Creating employee: {employee.name}")
    try:
        existing = db.employees.find_one({"$or": [{"employee_id": employee.employee_id}, {"email": employee.email}]})
        if existing:
            logger.warning(f"Employee already exists: ID={existing.get('employee_id')}, Email={existing.get('email')}")
            raise ValueError(f"Employee ID '{employee.employee_id}' or email '{employee.email}' already exists")
        
        emp_dict = employee.dict(exclude_none=True)
        emp_dict["created_at"] = datetime.utcnow()
        emp_dict["assigned_assets"] = []
        emp_dict["documents"] = []
        
        result = db.employees.insert_one(emp_dict)
        logger.debug(f"Inserted employee: {employee.name} with ID: {result.inserted_id}")
        
        response_dict = {**emp_dict, "id": str(result.inserted_id)}
        response_dict.pop("_id", None)  # Remove raw _id to prevent ObjectId type conflict
        created_employee = Employee(**response_dict)
        logger.info(f"Created employee with ID: {created_employee.id}")
        return created_employee
    except DuplicateKeyError:
        logger.warning(f"Duplicate found: employee_id={employee.employee_id}, email={employee.email}")
        raise ValueError(f"Employee ID '{employee.employee_id}' or email '{employee.email}' already exists")
    except Exception as e:
        logger.error(f"Error creating employee: {str(e)}", exc_info=True)
        raise

def update_employee(db: Database, id: str, employee: EmployeeCreate) -> Optional[Employee]:
    """
    Update an existing employee.
    """
    logger.info(f"Updating employee ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid employee ID")
        
        existing = db.employees.find_one(
            {
                "$and": [
                    {"_id": {"$ne": ObjectId(id)}},
                    {"$or": [{"employee_id": employee.employee_id}, {"email": employee.email}]}
                ]
            }
        )
        if existing:
            logger.warning(f"Employee ID or email already taken: ID={existing.get('employee_id')}, Email={existing.get('email')}")
            raise ValueError(f"Employee ID '{employee.employee_id}' or email '{employee.email}' already exists")
        
        emp_dict = employee.dict(exclude_unset=True)
        emp_dict["updated_at"] = datetime.utcnow()
        result = db.employees.update_one(
            {"_id": ObjectId(id)},
            {"$set": emp_dict}
        )
        if result.matched_count == 0:
            logger.warning(f"Employee not found: {id}")
            return None
        
        updated = db.employees.find_one({"_id": ObjectId(id)})
        updated_employee = Employee(**{**updated, "id": str(updated["_id"])})
        logger.debug(f"Updated employee: {updated_employee.name}")
        return updated_employee
    except DuplicateKeyError:
        logger.warning(f"Duplicate found: employee_id={employee.employee_id}, email={employee.email}")
        raise ValueError(f"Employee ID '{employee.employee_id}' or email '{employee.email}' already exists")
    except Exception as e:
        logger.error(f"Error updating employee {id}: {str(e)}", exc_info=True)
        raise

def delete_employee(db: Database, id: str) -> bool:
    """
    Delete an employee if no assets are assigned.
    """
    logger.info(f"Deleting employee ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid employee ID")
        
        emp = db.employees.find_one({"_id": ObjectId(id)})
        if not emp:
            logger.warning(f"Employee not found: {id}")
            return False
        
        if emp.get("assigned_assets"):
            logger.warning(f"Cannot delete employee {id}: Assets assigned")
            raise ValueError("Cannot delete employee with assigned assets")
        
        result = db.employees.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            logger.warning(f"Employee not found: {id}")
            return False
        
        logger.debug(f"Deleted employee ID: {id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting employee {id}: {str(e)}", exc_info=True)
        raise