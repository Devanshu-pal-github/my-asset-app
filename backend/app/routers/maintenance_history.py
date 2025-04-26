from fastapi import APIRouter, HTTPException, Depends
from pymongo.database import Database
from bson import ObjectId
from typing import List
from app.dependencies import get_db
from app.models.asset_item import AssetItem
from app.models.maintenance_history import MaintenanceHistoryEntry, MaintenanceRequest, MaintenanceUpdate
from app.services.maintenance_history_service import request_maintenance, update_maintenance_status
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/maintenance-history", tags=["Maintenance History"])

@router.get("/asset/{asset_id}", response_model=List[MaintenanceHistoryEntry])
async def read_maintenance_history(asset_id: str, db: Database = Depends(get_db)):
    """
    Retrieve the maintenance history for a specific asset.
    
    Args:
        asset_id (str): ID of the asset.
        db (Database): MongoDB database instance, injected via dependency.
    
    Returns:
        List[MaintenanceHistoryEntry]: List of maintenance history entries.
    
    Raises:
        HTTPException: 400 if asset_id is invalid, 404 if asset not found, 500 for server errors.
    """
    logger.info(f"Fetching maintenance history for asset {asset_id}")
    try:
        if not ObjectId.is_valid(asset_id):
            logger.warning(f"Invalid asset ID: {asset_id}")
            raise HTTPException(status_code=400, detail="Invalid asset ID")
        
        asset = db.asset_items.find_one({"_id": ObjectId(asset_id)})
        if not asset:
            logger.warning(f"Asset not found: {asset_id}")
            raise HTTPException(status_code=404, detail="Asset not found")
        
        history = [
            MaintenanceHistoryEntry(**entry) for entry in asset.get("maintenance_history", [])
        ]
        logger.debug(f"Fetched {len(history)} maintenance history entries for asset {asset_id}")
        return history
    except Exception as e:
        logger.error(f"Failed to fetch maintenance history for asset {asset_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch maintenance history: {str(e)}")

@router.post("/request", response_model=AssetItem)
async def request_asset_maintenance(request: MaintenanceRequest, db: Database = Depends(get_db)):
    """
    Request maintenance for an asset, updating its status and history.
    """
    logger.info(f"Requesting maintenance for asset {request.asset_id}")
    try:
        updated_asset = request_maintenance(db, request)
        logger.debug(f"Maintenance requested for asset {request.asset_id}")
        return updated_asset
    except ValueError as ve:
        logger.warning(f"Failed to request maintenance: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to request maintenance for asset {request.asset_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to request maintenance: {str(e)}")

@router.post("/update", response_model=AssetItem)
async def update_maintenance(update: MaintenanceUpdate, db: Database = Depends(get_db)):
    """
    Update maintenance status to completed, updating asset status and history.
    """
    logger.info(f"Updating maintenance {update.maintenance_id} for asset {update.asset_id}")
    try:
        updated_asset = update_maintenance_status(db, update)
        logger.debug(f"Maintenance updated for asset {update.asset_id}")
        return updated_asset
    except ValueError as ve:
        logger.warning(f"Failed to update maintenance: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to update maintenance for asset {update.asset_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update maintenance: {str(e)}")