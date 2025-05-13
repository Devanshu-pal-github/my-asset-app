from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from typing import List, Optional, Dict
from datetime import datetime
from app.models.employee import Employee, EmployeeCreate, AssignedAsset
from app.models.asset_item import AssetItem
from app.models.assignment_history import AssignmentHistoryEntry
from app.models.maintenance_history import MaintenanceHistoryEntry
from app.models.document import DocumentEntry
import logging

logger = logging.getLogger(__name__)

def get_employees(
    db: Collection,
    department: Optional[str] = None,
    status: Optional[str] = None,
    is_active: Optional[bool] = None
) -> List[Employee]:
    """
    Retrieve employees with optional filters.
    """
    logger.info(f"Fetching employees - department: {department}, status: {status}, is_active: {is_active}")
    try:
        query = {}
        if department:
            query["department"] = department
        if status:
            query["status"] = status
        if is_active is not None:
            query["is_active"] = is_active

        employees = list(db.find(query))
        result = [Employee(**{**emp, "id": str(emp["_id"]), "_id": str(emp["_id"])}) for emp in employees]
        logger.debug(f"Fetched {len(result)} employees")
        return result
    except Exception as e:
        logger.error(f"Error fetching employees: {str(e)}", exc_info=True)
        raise

def get_employee_by_id(db: Collection, id: str) -> Optional[Employee]:
    """
    Retrieve a specific employee by ID.
    """
    logger.info(f"Fetching employee ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid employee ID")

        employee = db.find_one({"_id": ObjectId(id)})
        if not employee:
            logger.warning(f"Employee not found: {id}")
            return None

        employee_dict = {**employee, "id": str(employee["_id"]), "_id": str(employee["_id"])}
        employee_obj = Employee(**employee_dict)
        logger.debug(f"Fetched employee: {employee_obj.first_name} {employee_obj.last_name}")
        return employee_obj
    except Exception as e:
        logger.error(f"Error fetching employee {id}: {str(e)}", exc_info=True)
        raise

def get_employee_details(db: Collection, id: str) -> Optional[Dict]:
    """
    Retrieve detailed information about an employee, including assigned assets, assignment history, maintenance history, and documents.
    """
    logger.info(f"Fetching employee details for ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid employee ID")

        employee = db.find_one({"_id": ObjectId(id)})
        if not employee:
            logger.warning(f"Employee not found: {id}")
            return None

        # Fetch current assets, assignment history, and maintenance history
        current_assets = []
        assignment_history = []
        maintenance_history = []
        for asset_ref in employee.get("assigned_assets", []):
            asset = db.database["asset_items"].find_one({"_id": ObjectId(asset_ref["asset_id"])})
            if asset:
                asset_dict = {**asset, "id": str(asset["_id"]), "_id": str(asset["_id"])}
                current_assets.append(asset_dict)
                # Fetch assignment history for this asset
                asset_assignment_history = [
                    entry for entry in asset.get("assignment_history", [])
                    if id in entry.get("assigned_to", [])
                ]
                assignment_history.extend(asset_assignment_history)
                # Fetch maintenance history for this asset
                maintenance_history.extend(asset.get("maintenance_history", []))

        # Fetch documents
        documents = list(db.database["documents"].find({"employee_id": str(id)}))
        documents = [{**doc, "id": str(doc["_id"]), "_id": str(doc["_id"])} for doc in documents]

        employee_dict = {
            "employee": {**employee, "id": str(employee["_id"]), "_id": str(employee["_id"])},
            "current_assets": current_assets,
            "assignment_history": assignment_history,
            "maintenance_history": maintenance_history,
            "documents": documents
        }
        logger.debug(f"Fetched employee details for: {employee_dict['employee']['first_name']} {employee_dict['employee']['last_name']}")
        return employee_dict
    except Exception as e:
        logger.error(f"Error fetching employee details {id}: {str(e)}", exc_info=True)
        raise

def create_employee(db: Collection, employee: EmployeeCreate) -> Employee:
    """
    Create a new employee with validation.
    """
    logger.info(f"Creating employee: {employee.first_name} {employee.last_name}")
    try:
        existing = db.find_one({"$or": [{"employee_id": employee.employee_id}, {"email": employee.email}]})
        if existing:
            logger.warning(f"Duplicate found: employee_id={existing.get('employee_id')}, email={existing.get('email')}")
            raise ValueError(f"Employee ID '{employee.employee_id}' or email '{employee.email}' already exists")

        employee_dict = employee.dict(exclude_none=True)
        employee_dict["assigned_assets"] = []
        employee_dict["documents"] = []
        employee_dict["created_at"] = datetime.utcnow()

        result = db.insert_one(employee_dict)
        logger.debug(f"Inserted employee: {employee.first_name} {employee.last_name} with ID: {result.inserted_id}")

        created_employee = Employee(**{**employee_dict, "id": str(result.inserted_id), "_id": str(result.inserted_id)})
        logger.info(f"Created employee with ID: {created_employee.id}")
        return created_employee
    except DuplicateKeyError:
        logger.warning(f"Duplicate found: employee_id={employee.employee_id}, email={employee.email}")
        raise ValueError(f"Employee ID '{employee.employee_id}' or email '{employee.email}' already exists")
    except Exception as e:
        logger.error(f"Error creating employee: {str(e)}", exc_info=True)
        raise

def update_employee(db: Collection, id: str, employee: EmployeeCreate) -> Optional[Employee]:
    """
    Update an existing employee.
    """
    logger.info(f"Updating employee ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid employee ID")

        existing = db.find_one({"_id": ObjectId(id)})
        if not existing:
            logger.warning(f"Employee not found: {id}")
            return None

        existing_duplicate = db.find_one(
            {"$or": [{"employee_id": employee.employee_id}, {"email": employee.email}], "_id": {"$ne": ObjectId(id)}}
        )
        if existing_duplicate:
            logger.warning(f"Duplicate found: employee_id={existing_duplicate.get('employee_id')}, email={existing_duplicate.get('email')}")
            raise ValueError(f"Employee ID '{employee.employee_id}' or email '{employee.email}' already exists")

        employee_dict = employee.dict(exclude_unset=True)
        employee_dict["updated_at"] = datetime.utcnow()

        result = db.update_one(
            {"_id": ObjectId(id)},
            {"$set": employee_dict}
        )
        if result.matched_count == 0:
            logger.warning(f"Employee not found: {id}")
            return None

        updated = db.find_one({"_id": ObjectId(id)})
        updated_employee = Employee(**{**updated, "id": str(updated["_id"]), "_id": str(updated["_id"])})
        logger.debug(f"Updated employee: {updated_employee.first_name} {updated_employee.last_name}")
        return updated_employee
    except DuplicateKeyError:
        logger.warning(f"Duplicate found: employee_id={employee.employee_id}, email={employee.email}")
        raise ValueError(f"Employee ID '{employee.employee_id}' or email '{employee.email}' already exists")
    except Exception as e:
        logger.error(f"Error updating employee {id}: {str(e)}", exc_info=True)
        raise

def delete_employee(db: Collection, id: str) -> bool:
    """
    Delete an employee if they have no active assignments.
    """
    logger.info(f"Deleting employee ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid employee ID")

        employee = db.find_one({"_id": ObjectId(id)})
        if not employee:
            logger.warning(f"Employee not found: {id}")
            return False

        if employee.get("assigned_assets", []):
            logger.warning(f"Cannot delete employee with assigned assets: {id}")
            raise ValueError("Cannot delete an employee with assigned assets")

        result = db.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            logger.warning(f"Employee not found: {id}")
            return False

        # Delete associated documents
        db.database["documents"].delete_many({"employee_id": str(id)})
        logger.debug(f"Deleted employee ID: {id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting employee {id}: {str(e)}", exc_info=True)
        raise

def get_employee_statistics(db: Collection) -> Dict:
    """
    Calculate employee-related statistics for dashboard.
    """
    logger.info("Calculating employee statistics")
    try:
        total_employees = db.count_documents({})
        active_employees = db.count_documents({"is_active": True})
        employees_with_assets = db.count_documents({"assigned_assets": {"$ne": []}})
        departments = db.distinct("department")
        department_stats = [
            {
                "department": dept,
                "total_employees": db.count_documents({"department": dept}),
                "active_employees": db.count_documents({"department": dept, "is_active": True}),
                "employees_with_assets": db.count_documents({"department": dept, "assigned_assets": {"$ne": []}})
            }
            for dept in departments if dept
        ]

        stats = {
            "total_employees": total_employees,
            "active_employees": active_employees,
            "employees_with_assets": employees_with_assets,
            "department_stats": department_stats
        }
        logger.debug(f"Employee statistics calculated: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Error calculating employee statistics: {str(e)}", exc_info=True)
        raise