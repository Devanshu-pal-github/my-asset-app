from fastapi import APIRouter, HTTPException, Depends
from pymongo.collection import Collection
from typing import List, Optional
from bson import ObjectId
from app.dependencies import get_db
from app.models.asset_item import AssetItem
from app.models.assignment_history import AssignmentHistoryEntry
from app.services.assignment_history_service import (
    assign_asset_to_employee,
    unassign_employee_from_asset
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assignment-history", tags=["Assignment History"])

@router.get("/asset/{asset_id}", response_model=List[AssignmentHistoryEntry])
async def read_assignment_history(asset_id: str, db: Collection = Depends(get_db)):
    """
    Retrieve the assignment history for a specific asset.
    
    Args:
        asset_id (str): ID of the asset.
        db (Collection): MongoDB database instance, injected via dependency.
    
    Returns:
        List[AssignmentHistoryEntry]: List of assignment history entries.
    
    Raises:
        HTTPException: 400 if asset_id is invalid, 404 if asset not found, 500 for server errors.
    """
    logger.info(f"Fetching assignment history for asset {asset_id}")
    try:
        if not ObjectId.is_valid(asset_id):
            logger.warning(f"Invalid asset ID: {asset_id}")
            raise HTTPException(status_code=400, detail="Invalid asset ID")
        
        asset = db.asset_items.find_one({"_id": ObjectId(asset_id)})
        if not asset:
            logger.warning(f"Asset not found: {asset_id}")
            raise HTTPException(status_code=404, detail="Asset not found")
        
        history = [
            AssignmentHistoryEntry(**entry) for entry in asset.get("assignment_history", [])
        ]
        logger.debug(f"Fetched {len(history)} assignment history entries for asset {asset_id}")
        return history
    except Exception as e:
        logger.error(f"Failed to fetch assignment history for asset {asset_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch assignment history: {str(e)}")

@router.post("/assign", response_model=AssetItem)
async def assign_asset(
    asset_id: str,
    employee_ids: List[str],
    condition: str,
    department: Optional[str] = None,
    assignment_type: Optional[str] = None,
    entity_type: Optional[str] = "Employee",
    notes: Optional[str] = None,
    db: Collection = Depends(get_db)
):
    """
    Assign an asset to one or more employees, updating assignment history.
    """
    logger.info(f"Assigning asset {asset_id} to employees {employee_ids}")
    try:
        updated_asset = assign_asset_to_employee(
            db, 
            asset_id, 
            employee_ids, 
            condition, 
            department=department,
            assignment_type=assignment_type,
            entity_type=entity_type,
            notes=notes
        )
        logger.debug(f"Assigned asset {asset_id} to {len(employee_ids)} employees")
        return updated_asset
    except ValueError as ve:
        logger.warning(f"Failed to assign asset: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to assign asset {asset_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to assign asset: {str(e)}")

@router.post("/unassign", response_model=AssetItem)
async def unassign_asset(
    asset_id: str,
    employee_id: str,
    condition: str,
    notes: Optional[str] = None,
    db: Collection = Depends(get_db)
):
    """
    Unassign a specific employee from an asset, updating assignment history.
    """
    logger.info(f"Unassigning employee {employee_id} from asset {asset_id}")
    try:
        updated_asset = unassign_employee_from_asset(db, asset_id, employee_id, condition, notes)
        logger.debug(f"Unassigned employee {employee_id} from asset {asset_id}")
        return updated_asset
    except ValueError as ve:
        logger.warning(f"Failed to unassign asset: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to unassign asset {asset_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to unassign asset: {str(e)}")