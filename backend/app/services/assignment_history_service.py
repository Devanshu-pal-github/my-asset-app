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
from dateutil.parser import parse
import pdb

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
    print("="*80)
    print("ENTERING assign_asset_to_employee FUNCTION")
    print(f"Assignment ID: {assignment.asset_id}")
    print(f"Employee ID: {assignment.assigned_to}")
    print("="*80)
    
    logger.info("="*50)
    logger.info("STARTING ASSIGNMENT PROCESS")
    logger.info(f"Assignment details: {assignment.dict()}")
    logger.info("="*50)
    
    try:
        # Check if asset exists and is available
        print("Fetching asset...")
        asset = db.database["asset_items"].find_one({"id": assignment.asset_id})
        print(f"Asset found: {asset is not None}")
        
        if not asset:
            logger.warning(f"Asset not found: {assignment.asset_id}")
            raise ValueError(f"Asset with ID {assignment.asset_id} not found")
        
        # Check if employee exists
        print("Fetching employee...")
        employee = db.database["employees"].find_one({"id": assignment.assigned_to})
        print(f"Employee found: {employee is not None}")
        
        if not employee:
            logger.warning(f"Employee not found: {assignment.assigned_to}")
            raise ValueError(f"Employee with ID {assignment.assigned_to} not found")
        
        # Check category policies if they exist
        category_id = asset.get("category_id")
        if category_id:
            category = db.database["asset_categories"].find_one({"id": category_id})
            if category:
                # Check if multiple assignments are allowed
                allow_multiple = category.get("assignment_policies", {}).get("allow_multiple_assignments", False)
                
                # If asset is already assigned and multiple assignments not allowed, prevent assignment
                if asset.get("has_active_assignment") and not allow_multiple:
                    logger.warning(f"Asset {assignment.asset_id} is already assigned and does not allow multiple assignments")
                    raise ValueError(f"Asset is already assigned and does not allow multiple assignments")
                
                # Check department restrictions
                assignable_to_depts = category.get("assignment_policies", {}).get("assignable_to_departments", [])
                if assignable_to_depts and employee.get("department") not in assignable_to_depts:
                    logger.warning(f"Employee department {employee.get('department')} not allowed for asset category")
                    raise ValueError(f"Employee's department is not allowed for this asset category")
        
        # Create assignment history entry
        current_time = get_current_datetime()
        
        # Calculate end date
        end_date = None
        if hasattr(assignment, 'duration') and assignment.duration:
            if hasattr(assignment, 'duration_unit') and assignment.duration_unit:
                duration_unit = assignment.duration_unit
            else:
                duration_unit = "days"
                
            if duration_unit == "days":
                end_date = current_time + timedelta(days=assignment.duration)
            elif duration_unit == "weeks":
                end_date = current_time + timedelta(weeks=assignment.duration)
            elif duration_unit == "months":
                end_date = current_time + timedelta(days=30 * assignment.duration)
            elif duration_unit == "years":
                end_date = current_time + timedelta(days=365 * assignment.duration)
        elif hasattr(assignment, 'expected_return_date') and assignment.expected_return_date:
            try:
                end_date = parse(assignment.expected_return_date)
            except Exception as e:
                logger.warning(f"Failed to parse expected_return_date: {e}")
                end_date = current_time + timedelta(days=365)
        else:
            end_date = current_time + timedelta(days=365)
        
        # Create the assignment record
        assignment_dict = {
            "id": generate_uuid(),
            "asset_id": assignment.asset_id,
            "asset_name": asset.get("name", "Unknown"),
            "asset_tag": asset.get("asset_tag", ""),
            "category_id": asset.get("category_id", ""),
            "category_name": asset.get("category_name", "Unknown"),
            "employee_id": assignment.assigned_to,
            "employee_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
            "employee_email": employee.get("email", ""),
            "employee_department": employee.get("department", ""),
            "assignment_date": current_time,
            "expected_return_date": end_date,
            "return_date": None,
            "status": "active",
            "notes": getattr(assignment, 'notes', None) or getattr(assignment, 'assignment_notes', None),
            "assigned_by": assignment.assigned_by,
            "assigned_by_name": assignment.assigned_by_name,
            "location": assignment.location or employee.get("location", ""),
            "checked_out": True,
            "checked_out_condition": getattr(assignment, 'checkout_condition', "good"),
            "checked_in": False,
            "created_at": current_time,
            "is_active": True,
            "has_active_assignment": True,
            "_id": None
        }
        
        print("Creating assignment record...")
        # Set _id field to the same value as id
        assignment_dict["_id"] = assignment_dict["id"]
        # Insert the assignment
        db.insert_one(assignment_dict)
        logger.debug(f"Inserted assignment: {assignment_dict['id']}")
        
        # Create current asset entry
        current_asset = {
            "id": asset.get("id"),
            "name": asset.get("name"),
            "asset_tag": asset.get("asset_tag"),
            "category_id": asset.get("category_id"),
            "category_name": asset.get("category_name"),
            "assignment_id": assignment_dict["id"],
            "assignment_date": current_time,
            "status": "active",
            "expected_return_date": end_date,
            "department": employee.get("department"),
            "location": assignment.location or employee.get("location", "")
        }
        
        # Debug: Log current asset data
        logger.info(f"Current asset entry to be added: {current_asset}")
        
        # Update asset status with all relevant fields
        db.database["asset_items"].update_one(
            {"id": assignment.asset_id},
            {"$set": {
                "status": "assigned",
                "has_active_assignment": True,
                "current_assignee_id": assignment.assigned_to,
                "current_assignee_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
                "current_assignment_id": assignment_dict["id"],
                "current_assignment_date": current_time,
                "expected_return_date": end_date,
                "location": assignment.location or employee.get("location", ""),
                "assigned_department": employee.get("department", ""),
                "last_assigned_date": current_time,
                "last_assigned_to": assignment.assigned_to,
                "last_assignment_id": assignment_dict["id"]
            }}
        )
        logger.info(f"Updated asset status to assigned: {assignment.asset_id}")
        
        print("Starting employee updates...")
        try:
            # First, remove any existing entries for this asset from current_assets
            remove_result = db.database["employees"].update_one(
                {"id": assignment.assigned_to},
                {
                    "$pull": {
                        "current_assets": {"id": asset.get("id")}
                    }
                }
            )
            print(f"Remove result - matched: {remove_result.matched_count}, modified: {remove_result.modified_count}")
            
            print("Updating employee with new current_asset...")
            # Then update employee status and add new current_asset entry
            update_result = db.database["employees"].update_one(
                {"id": assignment.assigned_to},
                {
                    "$set": {
                        "has_assigned_assets": True,
                        "last_asset_assigned_date": current_time,
                        "last_assigned_asset_id": assignment.asset_id,
                        "current_assignments_count": db.count_documents({
                            "employee_id": assignment.assigned_to,
                            "status": "active"
                        }) + 1
                    },
                    "$addToSet": {
                        "current_assets": current_asset,
                        "assigned_asset_ids": assignment.asset_id
                    }
                }
            )
            print(f"Update result - matched: {update_result.matched_count}, modified: {update_result.modified_count}")
            
            # Get employee data after update for verification
            after_employee = db.database["employees"].find_one({"id": assignment.assigned_to})
            print("Final employee state:")
            print(f"Has assigned assets: {after_employee.get('has_assigned_assets')}")
            print(f"Current assets: {after_employee.get('current_assets', [])}")
            
        except Exception as e:
            logger.error(f"Error updating employee current_assets: {str(e)}", exc_info=True)
            raise
        
        logger.info(f"Updated employee current_assets and status: {assignment.assigned_to}")
        
        # Add entry to asset's assignment history
        db.database["asset_items"].update_one(
            {"id": assignment.asset_id},
            {"$push": {"assignment_history": {
                "id": assignment_dict["id"],
                "employee_id": assignment.assigned_to,
                "employee_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
                "assignment_date": current_time,
                "expected_return_date": end_date,
                "status": "active",
                "is_active": True,
                "department": employee.get("department", ""),
                "location": assignment.location or employee.get("location", "")
            }}}
        )
        
        # Retrieve the updated asset
        updated_asset = db.database["asset_items"].find_one({"id": assignment.asset_id})
        
        # Remove _id field
        if "_id" in updated_asset:
            del updated_asset["_id"]
        
        # Convert to AssetItem
        updated_asset_item = AssetItem(**updated_asset)
        logger.debug(f"Asset assigned successfully: {updated_asset_item.name}")
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
    logger.info(f"Unassigning asset with assignment ID {assignment.assignment_id}")
    try:
        # Get the assignment record to find the asset_id
        assignment_record = db.find_one({"id": assignment.assignment_id})
        if not assignment_record:
            logger.warning(f"Assignment not found: {assignment.assignment_id}")
            raise ValueError(f"Assignment with ID {assignment.assignment_id} not found")
        
        # Get the asset_id from the assignment record
        asset_id = assignment_record.get("asset_id")
        if not asset_id:
            logger.warning(f"Asset ID not found in assignment: {assignment.assignment_id}")
            raise ValueError(f"Asset ID not found in assignment {assignment.assignment_id}")
        
        # Check if asset exists
        asset = db.database["asset_items"].find_one({"id": asset_id})
        if not asset:
            logger.warning(f"Asset not found: {asset_id}")
            raise ValueError(f"Asset with ID {asset_id} not found")
        
        # Get the employee_id from the assignment record
        employee_id = assignment_record.get("employee_id")
        if not employee_id:
            logger.warning(f"Employee ID not found in assignment: {assignment.assignment_id}")
            raise ValueError(f"Employee ID not found in assignment {assignment.assignment_id}")
        
        # Update assignment record
        current_time = get_current_datetime()
        
        # Extract fields safely from the assignment
        return_date = getattr(assignment, 'returned_date', None) or getattr(assignment, 'unassigned_at', None) or current_time
        return_notes = getattr(assignment, 'return_notes', None) or getattr(assignment, 'notes', None)
        condition = getattr(assignment, 'condition_after', None) or getattr(assignment, 'checkin_condition', None)
        
        # Update the assignment record
        update_result = db.update_one(
            {"id": assignment.assignment_id},
            {"$set": {
                "return_date": return_date,
                "status": "returned",
                "notes": f"{assignment_record.get('notes', '')} Return notes: {return_notes or ''}",
                "checked_in": True,
                "checked_in_condition": condition or "good",
                "updated_at": current_time,
                "is_active": False,
                "has_active_assignment": False
            }}
        )
        logger.debug(f"Updated assignment record: {assignment.assignment_id}")
        
        # Get return location safely
        return_location = getattr(assignment, 'return_location', None) 
        
        # Update asset status with all relevant fields cleared
        db.database["asset_items"].update_one(
            {"id": asset_id},
            {"$set": {
                "status": "available",
                "has_active_assignment": False,
                "current_assignee_id": None,
                "current_assignee_name": None,
                "current_assignment_id": None,
                "current_assignment_date": None,
                "expected_return_date": None,
                "location": return_location or asset.get("location", ""),
                "assigned_department": None,
                "last_unassigned_date": current_time
            }}
        )
        logger.info(f"Updated asset status to available: {asset_id}")
        
        # Update assignment history in asset
        db.database["asset_items"].update_one(
            {"id": asset_id, "assignment_history.id": assignment.assignment_id},
            {"$set": {
                "assignment_history.$.return_date": return_date,
                "assignment_history.$.status": "returned",
                "assignment_history.$.is_active": False,
                "assignment_history.$.has_active_assignment": False,
                "assignment_history.$.return_notes": return_notes,
                "assignment_history.$.return_condition": condition
            }}
        )
        
        # Update employee status and remove asset from current_assets
        db.database["employees"].update_one(
            {"id": employee_id},
            {
                "$pull": {
                    "current_assets": {"assignment_id": assignment.assignment_id},
                    "assigned_asset_ids": asset_id
                },
                "$set": {
                    "last_asset_unassigned_date": current_time
                }
            }
        )
        
        # Check if employee has other active assignments
        other_active_assignments = db.count_documents({
            "employee_id": employee_id,
            "status": "active",
            "id": {"$ne": assignment.assignment_id}
        })
        
        # Update employee's has_assigned_assets if no other active assignments
        if other_active_assignments == 0:
            db.database["employees"].update_one(
                {"id": employee_id},
                {
                    "$set": {
                        "has_assigned_assets": False,
                        "current_assignments_count": 0
                    }
                }
            )
        else:
            # Update just the count if there are other active assignments
            db.database["employees"].update_one(
                {"id": employee_id},
                {
                    "$set": {
                        "current_assignments_count": other_active_assignments
                    }
                }
            )
        
        logger.info(f"Updated employee assignment status: {employee_id}")
        
        # Update assignment history in employee
        db.database["employees"].update_one(
            {"id": employee_id, "assignment_history.id": assignment.assignment_id},
            {"$set": {
                "assignment_history.$.return_date": return_date,
                "assignment_history.$.status": "returned",
                "assignment_history.$.is_active": False,
                "assignment_history.$.has_active_assignment": False,
                "assignment_history.$.return_notes": return_notes,
                "assignment_history.$.return_condition": condition
            }}
        )
        
        # Retrieve the updated asset
        updated_asset = db.database["asset_items"].find_one({"id": asset_id})
        
        # Remove _id field
        if "_id" in updated_asset:
            del updated_asset["_id"]
        
        # Convert to AssetItem
        updated_asset_item = AssetItem(**updated_asset)
        logger.debug(f"Asset unassigned successfully: {updated_asset_item.name}")
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