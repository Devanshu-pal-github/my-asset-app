from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError, OperationFailure
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from app.models.asset_item import AssetItem, AssetStatus
from app.models.assignment_history import (
    AssignmentHistoryEntry, 
    AssignmentCreate, 
    AssignmentReturn, 
    AssignmentResponse,
    AssignmentStatus,
    AssignmentType
)
from app.models.utils import generate_uuid, get_current_datetime, serialize_model

logger = logging.getLogger(__name__)

def get_assignment_history_by_asset(
    db: Collection, 
    asset_id: str
) -> List[AssignmentResponse]:
    """
    Retrieve assignment history for a specific asset.
    
    Args:
        db (Collection): MongoDB collection
        asset_id (str): Asset ID to retrieve history for
        
    Returns:
        List[AssignmentResponse]: List of assignment history entries
    """
    logger.info(f"Fetching assignment history for asset ID: {asset_id}")
    try:
        # Check if asset exists
        asset = db.database["asset_items"].find_one({"id": asset_id})
        if not asset:
            logger.warning(f"Asset not found: {asset_id}")
            raise ValueError(f"Asset with ID {asset_id} not found")
        
        # Build query
        query = {"asset_id": asset_id}
        
        # Find assignment history in the collection
        history_entries = list(db.find(query).sort("assignment_date", -1))
        
        result = []
        for entry in history_entries:
            # Convert _id to id if needed
            if "_id" in entry and "id" not in entry:
                entry["id"] = str(entry["_id"])
            
            # Remove _id field as we have id
            if "_id" in entry:
                del entry["_id"]
            
            # Convert to AssignmentResponse
            assignment_response = AssignmentResponse(**entry)
            result.append(assignment_response)
        
        logger.debug(f"Fetched {len(result)} assignment entries for asset ID: {asset_id}")
        return result
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except ValueError as e:
        # Re-raise ValueError as is
        raise
    except Exception as e:
        logger.error(f"Error fetching assignment history for asset {asset_id}: {str(e)}", exc_info=True)
        raise

def get_assignment_history_by_employee(
    db: Collection, 
    employee_id: str
) -> List[AssignmentResponse]:
    """
    Retrieve assignment history for a specific employee.
    
    Args:
        db (Collection): MongoDB collection
        employee_id (str): Employee ID to retrieve history for
        
    Returns:
        List[AssignmentResponse]: List of assignment history entries
    """
    logger.info(f"Fetching assignment history for employee ID: {employee_id}")
    try:
        # Check if employee exists
        employee = db.database["employees"].find_one({"id": employee_id})
        if not employee:
            logger.warning(f"Employee not found: {employee_id}")
            raise ValueError(f"Employee with ID {employee_id} not found")
        
        # Build query
        query = {"employee_id": employee_id}
        
        # Find assignment history in the collection
        history_entries = list(db.find(query).sort("assignment_date", -1))
        
        result = []
        for entry in history_entries:
            # Convert _id to id if needed
            if "_id" in entry and "id" not in entry:
                entry["id"] = str(entry["_id"])
            
            # Remove _id field as we have id
            if "_id" in entry:
                del entry["_id"]
            
            # Convert to AssignmentResponse
            assignment_response = AssignmentResponse(**entry)
            result.append(assignment_response)
        
        logger.debug(f"Fetched {len(result)} assignment entries for employee ID: {employee_id}")
        return result
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except ValueError as e:
        # Re-raise ValueError as is
        raise
    except Exception as e:
        logger.error(f"Error fetching assignment history for employee {employee_id}: {str(e)}", exc_info=True)
        raise

def assign_asset_to_employee(
    db: Collection, 
    assignment: AssignmentCreate
) -> AssetItem:
    """
    Assign an asset to an employee, creating an assignment history entry.
    
    Args:
        db (Collection): MongoDB collection
        assignment (AssignmentCreate): Assignment data
        
    Returns:
        AssetItem: The updated asset
    """
    logger.info(f"Assigning asset {assignment.asset_id} to employee {assignment.employee_id}")
    try:
        # Check if asset exists and is available
        asset = db.database["asset_items"].find_one({"id": assignment.asset_id})
        if not asset:
            logger.warning(f"Asset not found: {assignment.asset_id}")
            raise ValueError(f"Asset with ID {assignment.asset_id} not found")
        
        # Check if asset is available
        if asset.get("has_active_assignment", False):
            logger.warning(f"Asset already assigned: {assignment.asset_id}")
            raise ValueError(f"Asset with ID {assignment.asset_id} is already assigned")
        
        if asset.get("status") not in ["available", "assigned"]:
            logger.warning(f"Asset not available for assignment: {assignment.asset_id}, status: {asset.get('status')}")
            raise ValueError(f"Asset with ID {assignment.asset_id} is not available for assignment")
        
        # Check if employee exists
        employee = db.database["employees"].find_one({"id": assignment.employee_id})
        if not employee:
            logger.warning(f"Employee not found: {assignment.employee_id}")
            raise ValueError(f"Employee with ID {assignment.employee_id} not found")
        
        # Check category policies if they exist
        category_id = asset.get("category_id")
        if category_id:
            category = db.database["asset_categories"].find_one({"id": category_id})
            if category:
                # Check if category can be assigned
                if not category.get("can_be_assigned_reassigned", True):
                    logger.warning(f"Category {category_id} cannot be assigned")
                    raise ValueError(f"Assets in category '{category.get('category_name', 'Unknown')}' cannot be assigned")
                
                # Check assignment policies
                policies = category.get("assignment_policies", {})
                
                # Check department restrictions if applicable
                assignable_to = policies.get("assignable_to")
                if assignable_to and assignable_to != "All Departments":
                    employee_dept = employee.get("department", "")
                    if employee_dept != assignable_to:
                        logger.warning(f"Employee department {employee_dept} not allowed to be assigned assets from category {category_id}")
                        raise ValueError(f"Employee in department '{employee_dept}' cannot be assigned assets from category '{category.get('category_name', 'Unknown')}'")
        
        # Create assignment history entry
        current_time = get_current_datetime()
        
        # Calculate end date if assignment has a duration
        end_date = None
        if assignment.duration and assignment.duration > 0:
            if assignment.duration_unit == "days":
                end_date = current_time + timedelta(days=assignment.duration)
            elif assignment.duration_unit == "weeks":
                end_date = current_time + timedelta(weeks=assignment.duration)
            elif assignment.duration_unit == "months":
                # Approximate months as 30 days
                end_date = current_time + timedelta(days=30 * assignment.duration)
            elif assignment.duration_unit == "years":
                # Approximate years as 365 days
                end_date = current_time + timedelta(days=365 * assignment.duration)
        
        assignment_dict = {
            "id": generate_uuid(),
            "asset_id": assignment.asset_id,
            "asset_name": asset.get("asset_name", "Unknown"),
            "asset_tag": asset.get("asset_tag", ""),
            "category_id": asset.get("category_id", ""),
            "category_name": asset.get("category_name", "Unknown"),
            "employee_id": assignment.employee_id,
            "employee_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
            "employee_email": employee.get("email", ""),
            "employee_department": employee.get("department", ""),
            "assignment_date": current_time,
            "expected_return_date": end_date,
            "return_date": None,
            "status": "active",
            "notes": assignment.notes,
            "assigned_by": assignment.assigned_by,
            "assigned_by_name": assignment.assigned_by_name,
            "location": assignment.location or employee.get("location", ""),
            "checked_out": True,
            "checked_out_condition": assignment.checked_out_condition or "good",
            "checked_in": False,
            "created_at": current_time,
            "_id": None
        }
        
        # Set _id field to the same value as id
        assignment_dict["_id"] = assignment_dict["id"]
        
        # Insert the assignment
        db.insert_one(assignment_dict)
        logger.debug(f"Inserted assignment: {assignment_dict['id']}")
        
        # Update asset status
        db.database["asset_items"].update_one(
            {"id": assignment.asset_id},
            {"$set": {
                "status": "assigned",
                "has_active_assignment": True,
                "current_assignee_id": assignment.employee_id,
                "current_assignee_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
                "current_assignment_id": assignment_dict["id"],
                "current_assignment_date": current_time,
                "expected_return_date": end_date,
                "location": assignment.location or employee.get("location", "")
            }}
        )
        logger.info(f"Updated asset status to assigned: {assignment.asset_id}")
        
        # Update employee status
        db.database["employees"].update_one(
            {"id": assignment.employee_id},
            {"$set": {
                "has_assigned_assets": True
            }}
        )
        logger.info(f"Updated employee has_assigned_assets: {assignment.employee_id}")
        
        # Add entry to asset's assignment history
        db.database["asset_items"].update_one(
            {"id": assignment.asset_id},
            {"$push": {"assignment_history": {
                "id": assignment_dict["id"],
                "employee_id": assignment.employee_id,
                "employee_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
                "assignment_date": current_time,
                "expected_return_date": end_date,
                "status": "active"
            }}}
        )
        
        # Add entry to employee's assignment history
        db.database["employees"].update_one(
            {"id": assignment.employee_id},
            {"$push": {"assignment_history": {
                "id": assignment_dict["id"],
                "asset_id": assignment.asset_id,
                "asset_name": asset.get("asset_name", "Unknown"),
                "asset_tag": asset.get("asset_tag", ""),
                "assignment_date": current_time,
                "expected_return_date": end_date,
                "status": "active"
            }}}
        )
        
        # Retrieve the updated asset
        updated_asset = db.database["asset_items"].find_one({"id": assignment.asset_id})
        
        # Remove _id field
        if "_id" in updated_asset:
            del updated_asset["_id"]
        
        # Convert to AssetItem
        updated_asset_item = AssetItem(**updated_asset)
        logger.debug(f"Asset assigned successfully: {updated_asset_item.asset_name}")
        return updated_asset_item
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except ValueError as e:
        # Re-raise ValueError as is
        raise
    except Exception as e:
        logger.error(f"Error assigning asset: {str(e)}", exc_info=True)
        raise

def unassign_employee_from_asset(
    db: Collection, 
    assignment: AssignmentReturn
) -> AssetItem:
    """
    Unassign an employee from an asset, updating the assignment history.
    
    Args:
        db (Collection): MongoDB collection
        assignment (AssignmentReturn): Unassignment data
        
    Returns:
        AssetItem: The updated asset
    """
    logger.info(f"Unassigning asset {assignment.asset_id}")
    try:
        # Check if asset exists and is assigned
        asset = db.database["asset_items"].find_one({"id": assignment.asset_id})
        if not asset:
            logger.warning(f"Asset not found: {assignment.asset_id}")
            raise ValueError(f"Asset with ID {assignment.asset_id} not found")
        
        # Check if asset is assigned
        if not asset.get("has_active_assignment", False):
            logger.warning(f"Asset not assigned: {assignment.asset_id}")
            raise ValueError(f"Asset with ID {assignment.asset_id} is not currently assigned")
        
        employee_id = asset.get("current_assignee_id")
        if not employee_id:
            logger.warning(f"Asset has no current assignee: {assignment.asset_id}")
            raise ValueError(f"Asset with ID {assignment.asset_id} has no current assignee")
        
        # Check if assignment exists
        assignment_id = asset.get("current_assignment_id")
        if not assignment_id:
            logger.warning(f"Asset has no current assignment: {assignment.asset_id}")
            raise ValueError(f"Asset with ID {assignment.asset_id} has no current assignment")
        
        # Get the assignment record
        assignment_record = db.find_one({"id": assignment_id})
        if not assignment_record:
            logger.warning(f"Assignment not found: {assignment_id}")
            # Continue anyway since we want to fix the asset state
        
        # Update assignment record
        current_time = get_current_datetime()
        
        if assignment_record:
            update_result = db.update_one(
                {"id": assignment_id},
                {"$set": {
                    "return_date": current_time,
                    "status": "returned",
                    "notes": f"{assignment_record.get('notes', '')} Return notes: {assignment.notes}",
                    "checked_in": True,
                    "checked_in_condition": assignment.condition,
                    "updated_at": current_time
                }}
            )
            logger.debug(f"Updated assignment record: {assignment_id}")
        
        # Update asset status
        db.database["asset_items"].update_one(
            {"id": assignment.asset_id},
            {"$set": {
                "status": "available",
                "has_active_assignment": False,
                "current_assignee_id": None,
                "current_assignee_name": None,
                "current_assignment_id": None,
                "current_assignment_date": None,
                "expected_return_date": None,
                "location": assignment.return_location or asset.get("location", "")
            }}
        )
        logger.info(f"Updated asset status to available: {assignment.asset_id}")
        
        # Update assignment history in asset
        db.database["asset_items"].update_one(
            {"id": assignment.asset_id, "assignment_history.id": assignment_id},
            {"$set": {
                "assignment_history.$.return_date": current_time,
                "assignment_history.$.status": "returned"
            }}
        )
        
        # Check if employee has other assigned assets
        other_assigned = db.database["asset_items"].count_documents({
            "current_assignee_id": employee_id,
            "has_active_assignment": True,
            "id": {"$ne": assignment.asset_id}
        })
        
        # Update employee's assigned status if no other assets
        if other_assigned == 0:
            db.database["employees"].update_one(
                {"id": employee_id},
                {"$set": {"has_assigned_assets": False}}
            )
            logger.info(f"Updated employee has_assigned_assets to false: {employee_id}")
        
        # Update assignment history in employee
        db.database["employees"].update_one(
            {"id": employee_id, "assignment_history.id": assignment_id},
            {"$set": {
                "assignment_history.$.return_date": current_time,
                "assignment_history.$.status": "returned"
            }}
        )
        
        # Retrieve the updated asset
        updated_asset = db.database["asset_items"].find_one({"id": assignment.asset_id})
        
        # Remove _id field
        if "_id" in updated_asset:
            del updated_asset["_id"]
        
        # Convert to AssetItem
        updated_asset_item = AssetItem(**updated_asset)
        logger.debug(f"Asset unassigned successfully: {updated_asset_item.asset_name}")
        return updated_asset_item
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except ValueError as e:
        # Re-raise ValueError as is
        raise
    except Exception as e:
        logger.error(f"Error unassigning asset: {str(e)}", exc_info=True)
        raise

def get_assignment_by_id(db: Collection, assignment_id: str) -> Optional[AssignmentResponse]:
    """
    Retrieve a specific assignment entry by ID.
    
    Args:
        db (Collection): MongoDB collection
        assignment_id (str): Assignment ID to retrieve
        
    Returns:
        Optional[AssignmentResponse]: The assignment entry if found, None otherwise
    """
    logger.info(f"Fetching assignment ID: {assignment_id}")
    try:
        assignment = db.find_one({"id": assignment_id})
        if not assignment:
            logger.warning(f"Assignment not found: {assignment_id}")
            return None
        
        # Remove _id field as we have id
        if "_id" in assignment:
            del assignment["_id"]
        
        # Convert to AssignmentResponse
        assignment_response = AssignmentResponse(**assignment)
        logger.debug(f"Fetched assignment: {assignment_response.id}")
        return assignment_response
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error fetching assignment {assignment_id}: {str(e)}", exc_info=True)
        raise