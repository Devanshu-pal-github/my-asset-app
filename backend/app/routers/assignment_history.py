from fastapi import APIRouter, HTTPException, Depends
from pymongo.collection import Collection
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.dependencies import get_db, get_assignment_history_collection
from app.models.asset_item import AssetItem
from app.models.assignment_history import AssignmentHistoryEntry, AssignmentCreate, AssignmentReturn, AssignmentResponse
from app.services.assignment_history_service import (
    get_assignment_history_by_asset
)
import logging
from app.models.utils import generate_uuid, get_current_datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assignment-history", tags=["Assignment History"])

@router.get("/asset/{asset_id}", response_model=List[AssignmentResponse])
async def read_assignment_history(asset_id: str, collection: Collection = Depends(get_assignment_history_collection)):
    """
    Retrieve the assignment history for a specific asset.
    
    Args:
        asset_id (str): ID of the asset.
        collection (Collection): MongoDB assignment history collection, injected via dependency.
    
    Returns:
        List[AssignmentResponse]: List of assignment history entries.
    
    Raises:
        HTTPException: 400 if asset_id is invalid, 404 if asset not found, 500 for server errors.
    """
    logger.info(f"Fetching assignment history for asset {asset_id}")
    try:
        history = get_assignment_history_by_asset(collection, asset_id)
        if history is None:
            logger.warning(f"Asset not found: {asset_id}")
            raise HTTPException(status_code=404, detail="Asset not found")
            
        logger.debug(f"Fetched {len(history)} assignment history entries for asset {asset_id}")
        return history
    except ValueError as ve:
        logger.warning(f"Invalid request: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to fetch assignment history for asset {asset_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch assignment history: {str(e)}")

@router.post("/", response_model=Dict[str, Any])
async def create_assignment(
    assignment: Dict[str, Any],
    db: Collection = Depends(get_assignment_history_collection)
):
    """
    Create a new assignment record.
    
    This endpoint matches the base URL expected by the frontend.
    Assigns an asset to an employee with validation.
    """
    print("\n" + "="*50)
    print("DEBUG: Executing create_assignment in router")
    print("="*50 + "\n")
    
    logger.info(f"Creating new assignment - asset {assignment.get('asset_id')} to {assignment.get('assigned_to')}")
    
    try:
        # Get the database for asset and employee collections
        full_db = get_db()
        
        # Simple validation
        asset_id = assignment.get("asset_id")
        assigned_to = assignment.get("assigned_to")
        
        if not asset_id or not assigned_to:
            logger.error(f"Missing required fields: asset_id={asset_id}, assigned_to={assigned_to}")
            raise HTTPException(status_code=400, detail="Both asset_id and assigned_to (employee_id) are required")
        
        # Get basic asset and employee info
        asset = full_db.asset_items.find_one({"id": asset_id})
        employee = full_db.employees.find_one({"id": assigned_to})
        
        if not asset:
            logger.error(f"Asset not found: {asset_id}")
            raise HTTPException(status_code=404, detail=f"Asset with ID {asset_id} not found")
        
        if not employee:
            logger.error(f"Employee not found: {assigned_to}")
            raise HTTPException(status_code=404, detail=f"Employee with ID {assigned_to} not found")
        
        # Generate a unique assignment ID
        assignment_id = generate_uuid()
        current_time = get_current_datetime()
        
        # Create the assignment record
        assignment_record = {
            "id": assignment_id,
            "_id": assignment_id,  # Use same ID for MongoDB _id
            "asset_id": asset_id,
            "asset_name": asset.get("name", "Unknown Asset"),
            "asset_tag": asset.get("asset_tag", ""),
            "category_id": asset.get("category_id", ""),
            "category_name": asset.get("category_name", ""),
            "employee_id": assigned_to,
            "employee_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
            "assignment_date": current_time,
            "expected_return_date": assignment.get("expected_return_date"),
            "assignment_type": assignment.get("assignment_type", "PERMANENT"),
            "condition": assignment.get("condition", "Good"),
            "department": assignment.get("department", employee.get("department", "")),
            "status": "active",
            "notes": assignment.get("assignment_notes", ""),
            "assigned_by": assignment.get("assigned_by", ""),
            "assigned_by_name": assignment.get("assigned_by_name", ""),
            "location": assignment.get("location", employee.get("location", "")),
            "created_at": current_time,
            "updated_at": current_time
        }
        
        # Insert assignment record
        db.insert_one(assignment_record)
        
        # Update asset status
        full_db.asset_items.update_one(
            {"id": asset_id},
            {
                "$set": {
                    "status": "assigned",
                    "has_active_assignment": True,
                    "current_assignee_id": assigned_to,
                    "current_assignee_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
                    "current_assignment_id": assignment_id,
                    "current_assignment_date": current_time.isoformat()
                },
                "$push": {
                    "assignment_history": {
                        "id": assignment_id,
                        "employee_id": assigned_to,
                        "employee_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
                        "assignment_date": current_time.isoformat(),
                        "status": "active"
                    }
                }
            }
        )
        
        # Update employee status
        logger.info(f"Starting employee updates for ID: {assigned_to}")
        
        # Create current asset entry
        current_asset = {
            "id": asset_id,
            "name": asset.get("name"),
            "asset_tag": asset.get("asset_tag"),
            "category_id": asset.get("category_id"),
            "category_name": asset.get("category_name"),
            "assignment_id": assignment_id,
            "assignment_date": current_time,
            "status": "active",
            "department": employee.get("department"),
            "location": assignment.get("location") or employee.get("location", "")
        }
        
        logger.info(f"Current asset entry to be added: {current_asset}")
        
        # First remove any existing entries
        remove_result = full_db.employees.update_one(
            {"id": assigned_to},
            {
                "$pull": {
                    "current_assets": {"id": asset_id}
                }
            }
        )
        logger.info(f"Remove result - matched: {remove_result.matched_count}, modified: {remove_result.modified_count}")
        
        # Then add the new current asset entry
        update_result = full_db.employees.update_one(
            {"id": assigned_to},
            {
                "$set": {
                    "has_assigned_assets": True,
                    "last_asset_assigned_date": current_time,
                    "last_assigned_asset_id": asset_id
                },
                "$addToSet": {
                    "current_assets": current_asset,
                    "assigned_asset_ids": asset_id
                },
                "$inc": {
                    "current_assignments_count": 1
                }
            }
        )
        logger.info(f"Update result - matched: {update_result.matched_count}, modified: {update_result.modified_count}")
        
        # Verify the update
        after_employee = full_db.employees.find_one({"id": assigned_to})
        logger.info(f"Employee after update - has_assigned_assets: {after_employee.get('has_assigned_assets')}")
        logger.info(f"Employee current_assets count: {len(after_employee.get('current_assets', []))}")
        logger.info(f"Employee current_assets: {after_employee.get('current_assets', [])}")
        
        logger.info(f"Successfully created assignment: {assignment_id} for asset {asset_id} to employee {assigned_to}")
        
        # Return success response with the assignment record
        return assignment_record
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating assignment: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create assignment: {str(e)}")

@router.post("/bulk", response_model=List[Dict[str, Any]])
async def create_bulk_assignments(
    assignments: List[Dict[str, Any]],
    db: Collection = Depends(get_assignment_history_collection)
):
    """
    Create multiple assignment records in a single request.
    
    Bulk assigns assets to employees with validation.
    
    Args:
        assignments (List[Dict[str, Any]]): List of assignment objects
        db (Collection): MongoDB collection, injected via dependency
    
    Returns:
        List[Dict[str, Any]]: List of created assignment records
    
    Raises:
        HTTPException: 400 for bad request, 404 for not found, 500 for server errors
    """
    logger.info(f"Creating {len(assignments)} assignments in bulk")
    
    created_assignments = []
    errors = []
    
    for idx, assignment in enumerate(assignments):
        try:
            logger.debug(f"Processing assignment {idx+1}/{len(assignments)}: asset {assignment.get('asset_id')} to {assignment.get('assigned_to')}")
            
            # Get the database for asset and employee collections
            full_db = get_db()
            
            # Simple validation
            asset_id = assignment.get("asset_id")
            assigned_to = assignment.get("assigned_to")
            
            if not asset_id or not assigned_to:
                err_msg = f"Both asset_id and assigned_to (employee_id) are required"
                logger.error(f"Assignment {idx+1}: {err_msg}")
                errors.append(f"Assignment {idx+1}: {err_msg}")
                continue
            
            # Get basic asset and employee info
            asset = full_db.asset_items.find_one({"id": asset_id})
            employee = full_db.employees.find_one({"id": assigned_to})
            
            if not asset:
                err_msg = f"Asset with ID {asset_id} not found"
                logger.error(f"Assignment {idx+1}: {err_msg}")
                errors.append(f"Assignment {idx+1}: {err_msg}")
                continue
            
            if not employee:
                err_msg = f"Employee with ID {assigned_to} not found"
                logger.error(f"Assignment {idx+1}: {err_msg}")
                errors.append(f"Assignment {idx+1}: {err_msg}")
                continue
            
            # Generate a unique assignment ID
            assignment_id = generate_uuid()
            current_time = get_current_datetime()
            
            # Create the assignment record
            assignment_record = {
                "id": assignment_id,
                "_id": assignment_id,  # Use same ID for MongoDB _id
                "asset_id": asset_id,
                "asset_name": asset.get("name", "Unknown Asset"),
                "asset_tag": asset.get("asset_tag", ""),
                "category_id": asset.get("category_id", ""),
                "category_name": asset.get("category_name", ""),
                "employee_id": assigned_to,
                "employee_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
                "assignment_date": current_time,
                "expected_return_date": assignment.get("expected_return_date"),
                "assignment_type": assignment.get("assignment_type", "PERMANENT"),
                "condition": assignment.get("condition", "Good"),
                "department": assignment.get("department", employee.get("department", "")),
                "status": "active",
                "notes": assignment.get("assignment_notes", ""),
                "assigned_by": assignment.get("assigned_by", ""),
                "assigned_by_name": assignment.get("assigned_by_name", ""),
                "location": assignment.get("location", employee.get("location", "")),
                "created_at": current_time,
                "updated_at": current_time
            }
            
            # Insert assignment record
            db.insert_one(assignment_record)
            
            # Update asset status
            full_db.asset_items.update_one(
                {"id": asset_id},
                {
                    "$set": {
                        "status": "assigned",
                        "has_active_assignment": True,
                        "current_assignee_id": assigned_to,
                        "current_assignee_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
                        "current_assignment_id": assignment_id,
                        "current_assignment_date": current_time.isoformat()
                    },
                    "$push": {
                        "assignment_history": {
                            "id": assignment_id,
                            "employee_id": assigned_to,
                            "employee_name": f"{employee.get('first_name', '')} {employee.get('last_name', '')}",
                            "assignment_date": current_time.isoformat(),
                            "status": "active"
                        }
                    }
                }
            )
            
            # Update employee status
            logger.info(f"Starting employee updates for ID: {assigned_to}")
            
            # Create current asset entry
            current_asset = {
                "id": asset_id,
                "name": asset.get("name"),
                "asset_tag": asset.get("asset_tag"),
                "category_id": asset.get("category_id"),
                "category_name": asset.get("category_name"),
                "assignment_id": assignment_id,
                "assignment_date": current_time,
                "status": "active",
                "department": employee.get("department"),
                "location": assignment.get("location") or employee.get("location", "")
            }
            
            logger.info(f"Current asset entry to be added: {current_asset}")
            
            # First remove any existing entries
            remove_result = full_db.employees.update_one(
                {"id": assigned_to},
                {
                    "$pull": {
                        "current_assets": {"id": asset_id}
                    }
                }
            )
            logger.info(f"Remove result - matched: {remove_result.matched_count}, modified: {remove_result.modified_count}")
            
            # Then add the new current asset entry
            update_result = full_db.employees.update_one(
                {"id": assigned_to},
                {
                    "$set": {
                        "has_assigned_assets": True,
                        "last_asset_assigned_date": current_time,
                        "last_assigned_asset_id": asset_id
                    },
                    "$addToSet": {
                        "current_assets": current_asset,
                        "assigned_asset_ids": asset_id
                    },
                    "$inc": {
                        "current_assignments_count": 1
                    }
                }
            )
            logger.info(f"Update result - matched: {update_result.matched_count}, modified: {update_result.modified_count}")
            
            # Verify the update
            after_employee = full_db.employees.find_one({"id": assigned_to})
            logger.info(f"Employee after update - has_assigned_assets: {after_employee.get('has_assigned_assets')}")
            logger.info(f"Employee current_assets count: {len(after_employee.get('current_assets', []))}")
            logger.info(f"Employee current_assets: {after_employee.get('current_assets', [])}")
            
            logger.info(f"Successfully created assignment {idx+1}: {assignment_id} for asset {asset_id} to employee {assigned_to}")
            created_assignments.append(assignment_record)
            
        except Exception as e:
            logger.error(f"Error creating assignment {idx+1}: {str(e)}", exc_info=True)
            errors.append(f"Assignment {idx+1}: {str(e)}")
    
    if errors and not created_assignments:
        # If all assignments failed, return 400 with error details
        raise HTTPException(status_code=400, detail={"message": "All assignments failed to create", "errors": errors})
    
    if errors:
        # If some assignments failed but others succeeded, log the errors
        logger.warning(f"Some assignments failed to create: {errors}")
    
    logger.info(f"Successfully created {len(created_assignments)} out of {len(assignments)} assignments")
    return created_assignments

@router.post("/unassign")
async def unassign_asset(
    data: Dict[str, Any],
    db: Collection = Depends(get_assignment_history_collection)
):
    """
    Simplified asset unassignment function.
    
    Unassigns an asset from an employee with minimal validation to ensure the operation works.
    """
    logger.info(f"Unassigning asset with assignment ID {data.get('assignment_id')}")
    
    try:
        # Get the database for asset and employee collections
        full_db = get_db()
        
        # Simple validation
        assignment_id = data.get("assignment_id")
        
        if not assignment_id:
            raise HTTPException(status_code=400, detail="assignment_id is required")
        
        # Get the assignment record
        assignment_record = db.find_one({"id": assignment_id})
        
        if not assignment_record:
            raise HTTPException(status_code=404, detail=f"Assignment with ID {assignment_id} not found")
        
        # Get asset and employee IDs from the assignment record
        asset_id = assignment_record.get("asset_id")
        employee_id = assignment_record.get("employee_id")
        
        # Get return information
        return_date = data.get("returned_date", get_current_datetime())
        if isinstance(return_date, str):
            return_date = datetime.fromisoformat(return_date.replace("Z", "+00:00"))
        
        return_notes = data.get("return_notes", "")
        return_condition = data.get("condition_after", "good")
        
        # Update assignment record
        db.update_one(
            {"id": assignment_id},
            {
                "$set": {
                    "status": "returned",
                    "return_date": return_date,
                    "return_notes": return_notes,
                    "return_condition": return_condition,
                    "updated_at": get_current_datetime()
                }
            }
        )
        
        # Update asset status
        full_db.asset_items.update_one(
            {"id": asset_id},
            {
                "$set": {
                    "status": "available",
                    "has_active_assignment": False,
                    "current_assignee_id": None,
                    "current_assignee_name": None,
                    "current_assignment_id": None,
                    "current_assignment_date": None
                }
            }
        )
        
        # Update assignment history in asset
        full_db.asset_items.update_one(
            {"id": asset_id, "assignment_history.id": assignment_id},
            {
                "$set": {
                    "assignment_history.$.status": "returned",
                    "assignment_history.$.return_date": return_date.isoformat()
                }
            }
        )
        
        # Update assignment history in employee
        full_db.employees.update_one(
            {"id": employee_id, "assignment_history.id": assignment_id},
            {
                "$set": {
                    "assignment_history.$.status": "returned",
                    "assignment_history.$.return_date": return_date.isoformat()
                }
            }
        )
        
        # Check if the employee has any other assets assigned
        other_assigned = full_db.asset_items.count_documents({
            "current_assignee_id": employee_id,
            "has_active_assignment": True
        })
        
        # If no other assets are assigned, update the employee's status
        if other_assigned == 0:
            full_db.employees.update_one(
                {"id": employee_id},
                {
                    "$set": {
                        "has_assigned_assets": False
                    }
                }
            )
        
        # Return success response
        return {
            "status": "success",
            "message": f"Asset successfully unassigned from employee",
            "assignment_id": assignment_id,
            "asset_id": asset_id,
            "employee_id": employee_id,
            "return_date": return_date.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unassigning asset: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to unassign asset: {str(e)}")

@router.post("/unassign/bulk")
async def unassign_bulk_assets(
    data_list: List[Dict[str, Any]],
    db: Collection = Depends(get_assignment_history_collection)
):
    """
    Unassign multiple assets in a single request.
    
    Args:
        data_list (List[Dict[str, Any]]): List of unassignment objects with assignment_id
        db (Collection): MongoDB collection, injected via dependency
    
    Returns:
        Dict[str, Any]: Result summary with success and error counts
    
    Raises:
        HTTPException: 400 for bad request, 500 for server errors
    """
    logger.info(f"Unassigning {len(data_list)} assets in bulk")
    
    processed_assignments = []
    errors = []
    
    for idx, data in enumerate(data_list):
        try:
            logger.debug(f"Processing unassignment {idx+1}/{len(data_list)}: assignment ID {data.get('assignment_id')}")
            
            # Simple validation
            assignment_id = data.get("assignment_id")
            
            if not assignment_id:
                err_msg = "assignment_id is required"
                logger.error(f"Unassignment {idx+1}: {err_msg}")
                errors.append(f"Unassignment {idx+1}: {err_msg}")
                continue
            
            # Get the database for asset and employee collections
            full_db = get_db()
            
            # Get the assignment record
            assignment_record = db.find_one({"id": assignment_id})
            
            if not assignment_record:
                err_msg = f"Assignment with ID {assignment_id} not found"
                logger.error(f"Unassignment {idx+1}: {err_msg}")
                errors.append(f"Unassignment {idx+1}: {err_msg}")
                continue
            
            # Extract asset and employee IDs from the assignment record
            asset_id = assignment_record.get("asset_id")
            employee_id = assignment_record.get("employee_id") or assignment_record.get("assigned_to")
            
            if not asset_id or not employee_id:
                err_msg = f"Assignment record missing asset_id or employee_id"
                logger.error(f"Unassignment {idx+1}: {err_msg}")
                errors.append(f"Unassignment {idx+1}: {err_msg}")
                continue
            
            # Get the current time
            current_time = get_current_datetime()
            return_date = data.get("returned_date") or current_time.isoformat()
            return_notes = data.get("return_notes") or "Unassigned via bulk operation"
            return_condition = data.get("return_condition") or "Good"
            
            # Update the assignment record
            db.update_one(
                {"id": assignment_id},
                {
                    "$set": {
                        "status": "returned",
                        "return_date": return_date,
                        "return_notes": return_notes,
                        "return_condition": return_condition,
                        "updated_at": current_time
                    }
                }
            )
            
            # Update the asset document
            full_db.asset_items.update_one(
                {"id": asset_id},
                {
                    "$set": {
                        "status": "available",
                        "has_active_assignment": False,
                        "current_assignee_id": None,
                        "current_assignee_name": None,
                        "current_assignment_id": None
                    },
                    "$push": {
                        "assignment_history": {
                            "id": assignment_id,
                            "status": "returned",
                            "return_date": return_date,
                            "return_notes": return_notes,
                            "return_condition": return_condition
                        }
                    }
                }
            )
            
            # Update the employee document - need to check if they have any other active assignments
            other_active_assignments = db.find(
                {
                    "employee_id": employee_id,
                    "id": {"$ne": assignment_id},
                    "status": "active"
                }
            ).count()
            
            update_data = {
                "$push": {
                    "assignment_history": {
                        "id": assignment_id,
                        "asset_id": asset_id,
                        "status": "returned",
                        "return_date": return_date,
                        "return_notes": return_notes
                    }
                }
            }
            
            # Only update has_assigned_assets if this was the last active assignment
            if other_active_assignments == 0:
                update_data["$set"] = {"has_assigned_assets": False}
            
            full_db.employees.update_one({"id": employee_id}, update_data)
            
            processed_assignments.append({
                "assignment_id": assignment_id,
                "asset_id": asset_id,
                "employee_id": employee_id,
                "return_date": return_date,
                "status": "returned"
            })
            
            logger.info(f"Successfully unassigned asset {asset_id} from employee {employee_id}, assignment ID: {assignment_id}")
            
        except Exception as e:
            logger.error(f"Error unassigning asset {idx+1}: {str(e)}", exc_info=True)
            errors.append(f"Unassignment {idx+1}: {str(e)}")
    
    if errors and not processed_assignments:
        # If all unassignments failed, return 400 with error details
        raise HTTPException(status_code=400, detail={"message": "All unassignments failed", "errors": errors})
    
    result = {
        "success_count": len(processed_assignments),
        "error_count": len(errors),
        "total": len(data_list),
        "processed": processed_assignments
    }
    
    if errors:
        # If some unassignments failed but others succeeded, include the errors in the response
        result["errors"] = errors
        logger.warning(f"Some unassignments failed: {errors}")
    
    logger.info(f"Successfully unassigned {len(processed_assignments)} out of {len(data_list)} assignments")
    return result

@router.post("/assign", response_model=Dict[str, Any])
async def assign_asset(
    assignment: Dict[str, Any],
    db: Collection = Depends(get_assignment_history_collection)
):
    """
    Assigns an asset to an employee (backward compatibility endpoint).
    
    This endpoint maintains compatibility with existing code that might still 
    be using /api/assignment-history/assign.
    """
    logger.info(f"Assign endpoint called - redirecting to base endpoint")
    # Simply call the create_assignment endpoint with the same parameters
    return await create_assignment(assignment, db)