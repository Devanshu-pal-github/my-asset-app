from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError, OperationFailure
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.employee import (
    Employee, 
    EmployeeCreate, 
    EmployeeUpdate,
    EmployeeResponse
)
from app.models.asset_item import AssetItem
from app.models.assignment_history import AssignmentHistoryEntry
from app.models.maintenance_history import MaintenanceHistoryEntry
from app.models.document import Document
from app.models.utils import generate_uuid, get_current_datetime, serialize_model
import logging

logger = logging.getLogger(__name__)

def get_employees(
    db: Collection, 
    filters: Dict[str, Any] = None
) -> List[EmployeeResponse]:
    """
    Retrieve employees with optional filtering.
    
    Args:
        db (Collection): MongoDB collection
        filters (Dict[str, Any], optional): Filtering criteria
        
    Returns:
        List[EmployeeResponse]: List of employees
    """
    logger.info("Fetching employees with filters")
    try:
        query = {}
        
        # Apply filters if provided
        if filters:
            if "department" in filters and filters["department"]:
                query["department"] = filters["department"]
                
            if "location" in filters and filters["location"]:
                query["location"] = filters["location"]
                
            if "position" in filters and filters["position"]:
                query["position"] = filters["position"]
                
            if "employee_id" in filters and filters["employee_id"]:
                query["employee_id"] = {"$regex": filters["employee_id"], "$options": "i"}
                
            if "email" in filters and filters["email"]:
                query["email"] = {"$regex": filters["email"], "$options": "i"}
                
            if "is_active" in filters:
                query["is_active"] = filters["is_active"]
                
            if "has_assigned_assets" in filters:
                query["has_assigned_assets"] = filters["has_assigned_assets"]
                
            if "search" in filters and filters["search"]:
                search_regex = {"$regex": filters["search"], "$options": "i"}
                query["$or"] = [
                    {"first_name": search_regex},
                    {"last_name": search_regex},
                    {"email": search_regex},
                    {"employee_id": search_regex},
                    {"department": search_regex},
                    {"position": search_regex}
                ]
        
        employees = list(db.find(query))
        result = []
        
        for employee in employees:
            # Convert _id to id if needed
            if "_id" in employee and "id" not in employee:
                employee["id"] = str(employee["_id"])
                
            # Remove _id field as we have id
            if "_id" in employee:
                del employee["_id"]
                
            # Get assigned assets count
            assigned_assets_count = db.database["asset_items"].count_documents({
                "current_assignee_id": employee["id"],
                "has_active_assignment": True
            })
            
            # Set total_assigned_assets
            employee["total_assigned_assets"] = assigned_assets_count
            
            # Ensure assigned_assets is a list of AssignedAsset objects
            if "assigned_assets" not in employee or not isinstance(employee["assigned_assets"], list):
                employee["assigned_assets"] = []
            
            # Convert to EmployeeResponse
            employee_response = EmployeeResponse(**employee)
            result.append(employee_response)
            
        logger.debug(f"Fetched {len(result)} employees")
        return result
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error fetching employees: {str(e)}", exc_info=True)
        raise

def get_employee_by_id(db: Collection, employee_id: str) -> Optional[EmployeeResponse]:
    """
    Retrieve a specific employee by ID.
    
    Args:
        db (Collection): MongoDB collection
        employee_id (str): Employee ID to retrieve
        
    Returns:
        Optional[EmployeeResponse]: The employee if found, None otherwise
    """
    logger.info(f"Fetching employee ID: {employee_id}")
    try:
        employee = db.find_one({"id": employee_id})
        if not employee:
            logger.warning(f"Employee not found: {employee_id}")
            return None
        
        # Remove _id field as we have id
        if "_id" in employee:
            del employee["_id"]
            
        # Get assigned assets
        assigned_assets = list(db.database["asset_items"].find({
            "current_assignee_id": employee_id,
            "has_active_assignment": True
        }))
        
        # Add assigned assets count
        employee["assigned_assets_count"] = len(assigned_assets)
        
        # Add assigned assets details
        employee["assigned_assets"] = []
        for asset in assigned_assets:
            if "_id" in asset:
                del asset["_id"]
            employee["assigned_assets"].append(asset)
        
        # Convert to EmployeeResponse
        employee_response = EmployeeResponse(**employee)
        logger.debug(f"Fetched employee: {employee_response.first_name} {employee_response.last_name}")
        return employee_response
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error fetching employee {employee_id}: {str(e)}", exc_info=True)
        raise

def get_employee_details(db: Collection, id: str) -> Optional[Dict]:
    """
    Retrieve detailed information about an employee, including assigned assets, assignment history, maintenance history, and documents.
    
    Args:
        db (Collection): MongoDB collection
        id (str): Employee ID to retrieve details for
        
    Returns:
        Optional[Dict]: Employee details including related data, or None if not found
    """
    logger.info(f"Fetching employee details for ID: {id}")
    try:
        employee = db.find_one({"id": id})
        if not employee:
            logger.warning(f"Employee not found: {id}")
            return None

        # Fetch current assets, assignment history, and maintenance history
        current_assets = []
        assignment_history = []
        maintenance_history = []
        for asset_ref in employee.get("assigned_assets", []):
            asset = db.database["asset_items"].find_one({"id": asset_ref["asset_id"]})
            if asset:
                # Remove _id field as we have id
                if "_id" in asset:
                    del asset["_id"]
                current_assets.append(asset)
                # Fetch assignment history for this asset
                asset_assignment_history = [
                    entry for entry in asset.get("assignment_history", [])
                    if id in entry.get("assigned_to", [])
                ]
                assignment_history.extend(asset_assignment_history)
                # Fetch maintenance history for this asset
                maintenance_history.extend(asset.get("maintenance_history", []))

        # Fetch documents
        documents = list(db.database["documents"].find({"employee_id": id}))
        for doc in documents:
            # Remove _id field as we have id
            if "_id" in doc:
                del doc["_id"]

        # Remove _id field as we have id
        if "_id" in employee:
            del employee["_id"]

        employee_dict = {
            "employee": employee,
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

def create_employee(db: Collection, employee: EmployeeCreate) -> EmployeeResponse:
    """
    Create a new employee.
    
    Args:
        db (Collection): MongoDB collection
        employee (EmployeeCreate): Employee data to create
        
    Returns:
        EmployeeResponse: The created employee
    """
    logger.info(f"Creating employee: {employee.first_name} {employee.last_name}")
    try:
        # Convert to dict, excluding None values
        employee_dict = employee.model_dump(exclude_none=True)
        
        # Check if employee with email already exists
        if employee.contact and employee.contact.email:
            existing = db.find_one({"email": employee.contact.email})
            if existing:
                logger.warning(f"Employee with email already exists: {employee.contact.email}")
                raise ValueError(f"Employee with email '{employee.contact.email}' already exists")
        
        # Check if employee with employee_id already exists
        if employee.employee_id:
            existing = db.find_one({"employee_id": employee.employee_id})
            if existing:
                logger.warning(f"Employee with employee_id already exists: {employee.employee_id}")
                raise ValueError(f"Employee with ID '{employee.employee_id}' already exists")
        
        # Set default values
        employee_dict["is_active"] = employee_dict.get("is_active", True)
        employee_dict["has_assigned_assets"] = False
        
        # Initialize metadata fields
        employee_dict["assignment_history"] = []
        employee_dict["documents"] = []
        employee_dict["edit_history"] = []
        employee_dict["created_at"] = get_current_datetime()
        
        # Generate UUID for the id field
        employee_dict["id"] = generate_uuid()
        
        # Add _id field for MongoDB to use the same value as id
        employee_dict["_id"] = employee_dict["id"]
        
        # Insert the employee
        result = db.insert_one(employee_dict)
        logger.debug(f"Inserted employee with ID: {employee_dict['id']}")
        
        # Add a history entry for this creation
        edit_entry = {
            "id": generate_uuid(),
            "type": "creation",
            "edit_date": get_current_datetime().strftime("%Y-%m-%d"),
            "change_type": "Employee Creation",
            "details": "Initial employee creation",
            "notes": ""
        }
        
        # Add history entry to the document
        db.update_one(
            {"id": employee_dict["id"]},
            {"$push": {"edit_history": edit_entry}}
        )
        
        # Retrieve the created employee
        created_employee = db.find_one({"id": employee_dict["id"]})
        
        # Remove _id field
        if "_id" in created_employee:
            del created_employee["_id"]
        
        # Add assigned assets count (will be 0 for new employee)
        created_employee["assigned_assets_count"] = 0
        
        # Convert to EmployeeResponse
        employee_response = EmployeeResponse(**created_employee)
        logger.info(f"Created employee with ID: {employee_response.id}")
        return employee_response
    except DuplicateKeyError as e:
        logger.warning(f"Duplicate key error: {str(e)}")
        raise ValueError(f"Employee with duplicate key already exists: {str(e)}")
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except ValueError as e:
        # Re-raise ValueError as is
        raise
    except Exception as e:
        logger.error(f"Error creating employee: {str(e)}", exc_info=True)
        raise

def update_employee(db: Collection, employee_id: str, employee: EmployeeUpdate) -> Optional[EmployeeResponse]:
    """
    Update an existing employee.
    
    Args:
        db (Collection): MongoDB collection
        employee_id (str): Employee ID to update
        employee (EmployeeUpdate): Employee data to update
        
    Returns:
        Optional[EmployeeResponse]: The updated employee if found, None otherwise
    """
    logger.info(f"Updating employee ID: {employee_id}")
    try:
        # Check if employee exists
        existing_employee = db.find_one({"id": employee_id})
        if not existing_employee:
            logger.warning(f"Employee not found: {employee_id}")
            return None
        
        # Convert to dict, excluding unset and None values
        employee_dict = employee.model_dump(exclude_unset=True, exclude_none=True)
        
        # Check for duplicate email
        if "contact" in employee_dict and employee_dict["contact"] and employee_dict["contact"].get("email"):
            existing = db.find_one({
                "email": employee_dict["contact"]["email"], 
                "id": {"$ne": employee_id}
            })
            if existing:
                logger.warning(f"Employee with email already exists: {employee_dict['contact']['email']}")
                raise ValueError(f"Employee with email '{employee_dict['contact']['email']}' already exists")
        
        # Check for duplicate employee_id
        if "employee_id" in employee_dict and employee_dict["employee_id"]:
            existing = db.find_one({
                "employee_id": employee_dict["employee_id"], 
                "id": {"$ne": employee_id}
            })
            if existing:
                logger.warning(f"Employee with employee_id already exists: {employee_dict['employee_id']}")
                raise ValueError(f"Employee with ID '{employee_dict['employee_id']}' already exists")
        
        # Track edit history
        current_time = get_current_datetime()
        employee_dict["updated_at"] = current_time
        
        # Add a history entry for this update
        edit_entry = {
            "id": generate_uuid(),
            "type": "edit",
            "edit_date": current_time.strftime("%Y-%m-%d"),
            "change_type": "Employee Update",
            "details": f"Updated employee fields: {', '.join(employee_dict.keys())}",
            "notes": ""
        }
        
        # Add history entry to the document
        db.update_one(
            {"id": employee_id},
            {"$push": {"edit_history": edit_entry}}
        )
        
        # Apply all updates
        result = db.update_one(
            {"id": employee_id},
            {"$set": employee_dict}
        )
        
        if result.matched_count == 0:
            logger.warning(f"Employee not found: {employee_id}")
            return None
        
        # Fetch the updated employee
        updated_employee = db.find_one({"id": employee_id})
        
        # Remove _id field
        if "_id" in updated_employee:
            del updated_employee["_id"]
        
        # Get assigned assets
        assigned_assets = list(db.database["asset_items"].find({
            "current_assignee_id": employee_id,
            "has_active_assignment": True
        }))
        
        # Add assigned assets count
        updated_employee["assigned_assets_count"] = len(assigned_assets)
        
        # Add assigned assets details
        updated_employee["assigned_assets"] = []
        for asset in assigned_assets:
            if "_id" in asset:
                del asset["_id"]
            updated_employee["assigned_assets"].append(asset)
        
        # Convert to EmployeeResponse
        employee_response = EmployeeResponse(**updated_employee)
        logger.debug(f"Updated employee: {employee_response.first_name} {employee_response.last_name}")
        return employee_response
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except ValueError as e:
        # Re-raise ValueError as is
        raise
    except Exception as e:
        logger.error(f"Error updating employee {employee_id}: {str(e)}", exc_info=True)
        raise

def delete_employee(db: Collection, employee_id: str) -> bool:
    """
    Delete an employee if they have no assigned assets.
    
    Args:
        db (Collection): MongoDB collection
        employee_id (str): Employee ID to delete
        
    Returns:
        bool: True if employee was deleted, False if not found or has assigned assets
    """
    logger.info(f"Deleting employee ID: {employee_id}")
    try:
        # Check if employee exists
        existing_employee = db.find_one({"id": employee_id})
        if not existing_employee:
            logger.warning(f"Employee not found: {employee_id}")
            return False
        
        # Check if employee has assigned assets
        assigned_assets = db.database["asset_items"].count_documents({
            "current_assignee_id": employee_id,
            "has_active_assignment": True
        })
        
        if assigned_assets > 0:
            logger.warning(f"Cannot delete employee with assigned assets: {employee_id}, assets: {assigned_assets}")
            raise ValueError(f"Cannot delete employee with {assigned_assets} assigned assets")
        
        # Delete the employee
        result = db.delete_one({"id": employee_id})
        if result.deleted_count == 0:
            logger.warning(f"Employee not found for deletion: {employee_id}")
            return False
        
        logger.debug(f"Deleted employee ID: {employee_id}")
        return True
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error deleting employee {employee_id}: {str(e)}", exc_info=True)
        raise

def get_employee_departments(db: Collection) -> List[str]:
    """
    Get a list of all departments from employees.
    
    Args:
        db (Collection): MongoDB collection
        
    Returns:
        List[str]: List of unique departments
    """
    logger.info("Fetching employee departments")
    try:
        departments = db.distinct("department")
        return [dept for dept in departments if dept]
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error fetching employee departments: {str(e)}", exc_info=True)
        raise

def get_employee_positions(db: Collection) -> List[str]:
    """
    Get a list of all positions from employees.
    
    Args:
        db (Collection): MongoDB collection
        
    Returns:
        List[str]: List of unique positions
    """
    logger.info("Fetching employee positions")
    try:
        positions = db.distinct("position")
        return [pos for pos in positions if pos]
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error fetching employee positions: {str(e)}", exc_info=True)
        raise

def get_employee_locations(db: Collection) -> List[str]:
    """
    Get a list of all locations from employees.
    
    Args:
        db (Collection): MongoDB collection
        
    Returns:
        List[str]: List of unique locations
    """
    logger.info("Fetching employee locations")
    try:
        locations = db.distinct("location")
        return [loc for loc in locations if loc]
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error fetching employee locations: {str(e)}", exc_info=True)
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