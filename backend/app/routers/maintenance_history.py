from fastapi import APIRouter, HTTPException, Depends
from pymongo.database import Database
from typing import List
from app.dependencies import get_db, get_maintenance_history_collection
from app.models.asset_item import AssetItem
from app.models.maintenance_history import (
    MaintenanceHistoryEntry, 
    MaintenanceCreate, 
    MaintenanceUpdate, 
    MaintenanceResponse
)
from app.services.maintenance_history_service import (
    request_maintenance,
    update_maintenance_status,
    get_maintenance_history_by_asset
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/maintenance-history", tags=["Maintenance History"])

@router.get("/asset/{asset_id}", response_model=List[MaintenanceResponse])
async def read_maintenance_history(asset_id: str, collection: Database = Depends(get_maintenance_history_collection)):
    """
    Retrieve the maintenance history for a specific asset.
    
    Args:
        asset_id (str): ID of the asset.
        collection (Database): MongoDB maintenance history collection, injected via dependency.
    
    Returns:
        List[MaintenanceResponse]: List of maintenance history entries.
    
    Raises:
        HTTPException: 400 if asset_id is invalid, 404 if asset not found, 500 for server errors.
    """
    logger.info(f"Fetching maintenance history for asset {asset_id}")
    try:
        history = get_maintenance_history_by_asset(collection, asset_id)
        if history is None:
            logger.warning(f"Asset not found: {asset_id}")
            raise HTTPException(status_code=404, detail="Asset not found")
            
        logger.debug(f"Fetched {len(history)} maintenance history entries for asset {asset_id}")
        return history
    except ValueError as ve:
        logger.warning(f"Invalid request: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to fetch maintenance history for asset {asset_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch maintenance history: {str(e)}")

@router.post("/request", response_model=AssetItem)
async def request_asset_maintenance(maintenance: MaintenanceCreate, collection: Database = Depends(get_maintenance_history_collection)):
    """
    Request maintenance for an asset, updating its status and history.
    
    Args:
        maintenance (MaintenanceCreate): Maintenance request details
        collection (Database): MongoDB maintenance history collection, injected via dependency.
    
    Returns:
        AssetItem: Updated asset with new maintenance record
    """
    logger.info(f"Requesting maintenance for asset {maintenance.asset_id}")
    try:
        updated_asset = request_maintenance(collection, maintenance)
        logger.debug(f"Maintenance requested for asset {maintenance.asset_id}")
        return updated_asset
    except ValueError as ve:
        logger.warning(f"Failed to request maintenance: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to request maintenance for asset {maintenance.asset_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to request maintenance: {str(e)}")

@router.post("/update", response_model=AssetItem)
async def update_maintenance(update: MaintenanceUpdate, collection: Database = Depends(get_maintenance_history_collection)):
    """
    Update maintenance status, updating asset status and history.
    
    Args:
        update (MaintenanceUpdate): Maintenance update details
        collection (Database): MongoDB maintenance history collection, injected via dependency.
    
    Returns:
        AssetItem: Updated asset with maintenance record updated
    """
    logger.info(f"Updating maintenance {update.id}")
    try:
        updated_asset = update_maintenance_status(collection, update)
        logger.debug(f"Maintenance updated for asset")
        return updated_asset
    except ValueError as ve:
        logger.warning(f"Failed to update maintenance: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to update maintenance: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update maintenance: {str(e)}")