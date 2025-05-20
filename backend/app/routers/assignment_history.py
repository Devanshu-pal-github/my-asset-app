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

@router.post("/assign")
async def assign_asset(
    assignment: Dict[str, Any],
    db: Collection = Depends(get_assignment_history_collection)
):
    """
    Simplified asset assignment function.
    
    Assigns an asset to an employee with minimal validation to ensure the operation works.
    """
    logger.info(f"Assigning asset {assignment.get('asset_id')} to {assignment.get('assigned_to')}")
    
    try:
        # Get the database for asset and employee collections
        full_db = get_db()
        
        # Simple validation
        asset_id = assignment.get("asset_id")
        assigned_to = assignment.get("assigned_to")
        
        if not asset_id or not assigned_to:
            raise HTTPException(status_code=400, detail="Both asset_id and assigned_to (employee_id) are required")
        
        # Get basic asset and employee info
        asset = full_db.asset_items.find_one({"id": asset_id})
        employee = full_db.employees.find_one({"id": assigned_to})
        
        if not asset:
            raise HTTPException(status_code=404, detail=f"Asset with ID {asset_id} not found")
        
        if not employee:
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
            "status": "active",
            "notes": assignment.get("assignment_notes", ""),
            "assigned_by": assignment.get("assigned_by"),
            "assigned_by_name": assignment.get("assigned_by_name"),
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
        full_db.employees.update_one(
            {"id": assigned_to},
            {
                "$set": {
                    "has_assigned_assets": True
                },
                "$push": {
                    "assignment_history": {
                        "id": assignment_id,
                        "asset_id": asset_id,
                        "asset_name": asset.get("name", "Unknown Asset"),
                        "asset_tag": asset.get("asset_tag", ""),
                        "assignment_date": current_time.isoformat(),
                        "status": "active"
                    }
                }
            }
        )
        
        # Return success response
        return {
            "status": "success",
            "message": f"Asset successfully assigned to employee",
            "assignment_id": assignment_id,
            "asset_id": asset_id,
            "employee_id": assigned_to,
            "timestamp": current_time.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning asset: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to assign asset: {str(e)}")

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