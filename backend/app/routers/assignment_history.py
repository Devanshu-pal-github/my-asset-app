from fastapi import APIRouter, HTTPException, Depends
from pymongo.collection import Collection
from typing import List, Optional
from app.dependencies import get_db, get_assignment_history_collection
from app.models.asset_item import AssetItem
from app.models.assignment_history import AssignmentHistoryEntry, AssignmentCreate, AssignmentReturn, AssignmentResponse
from app.services.assignment_history_service import (
    assign_asset_to_employee,
    unassign_employee_from_asset,
    get_assignment_history_by_asset
)
import logging

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

@router.post("/assign", response_model=AssetItem)
async def assign_asset(
    assignment: AssignmentCreate,
    collection: Collection = Depends(get_assignment_history_collection)
):
    """
    Assign an asset to an employee, updating assignment history.
    
    Args:
        assignment (AssignmentCreate): Assignment details
        collection (Collection): MongoDB assignment history collection, injected via dependency.
        
    Returns:
        AssetItem: Updated asset with new assignment information
    """
    logger.info(f"Assigning asset {assignment.asset_id} to {assignment.assigned_to}")
    try:
        updated_asset = assign_asset_to_employee(collection, assignment)
        logger.debug(f"Assigned asset {assignment.asset_id} to {assignment.assigned_to}")
        return updated_asset
    except ValueError as ve:
        logger.warning(f"Failed to assign asset: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to assign asset {assignment.asset_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to assign asset: {str(e)}")

@router.post("/unassign", response_model=AssetItem)
async def unassign_asset(
    return_data: AssignmentReturn,
    collection: Collection = Depends(get_assignment_history_collection)
):
    """
    Unassign a specific employee from an asset, updating assignment history.
    
    Args:
        return_data (AssignmentReturn): Return details
        collection (Collection): MongoDB assignment history collection, injected via dependency.
        
    Returns:
        AssetItem: Updated asset with assignment removed
    """
    logger.info(f"Unassigning asset with assignment ID {return_data.assignment_id}")
    try:
        updated_asset = unassign_employee_from_asset(collection, return_data)
        logger.debug(f"Unassigned assignment {return_data.assignment_id}")
        return updated_asset
    except ValueError as ve:
        logger.warning(f"Failed to unassign asset: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to unassign assignment {return_data.assignment_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to unassign asset: {str(e)}")