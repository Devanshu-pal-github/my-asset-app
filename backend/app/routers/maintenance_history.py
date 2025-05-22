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
    get_maintenance_history_by_asset,
    get_all_maintenance_history
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/maintenance-history", tags=["Maintenance History"])

@router.post("", response_model=MaintenanceHistoryEntry)
async def create_maintenance_history(maintenance: MaintenanceHistoryEntry, db: Database = Depends(get_db)):
    """
    Create a new maintenance history entry.
    
    Args:
        maintenance (MaintenanceHistoryEntry): Maintenance history details
        db (Database): MongoDB database, injected via dependency.
    
    Returns:
        MaintenanceHistoryEntry: Created maintenance history entry
    """
    logger.info(f"Creating maintenance history entry for asset {maintenance.asset_id}")
    try:
        # Insert the new maintenance history entry
        result = db.maintenance_history.insert_one(maintenance.model_dump(exclude_unset=True))
        
        # Return the created entry
        created_entry = db.maintenance_history.find_one({"_id": result.inserted_id})
        if not created_entry:
            raise HTTPException(status_code=404, detail="Failed to retrieve created maintenance entry")
        
        # Update the maintenance count in the corresponding asset item
        db.asset_items.update_one(
            {"id": maintenance.asset_id},
            {"$inc": {"maintenance_count": 1}}
        )
        
        logger.debug(f"Maintenance history entry created for asset {maintenance.asset_id}")
        return MaintenanceHistoryEntry(**created_entry)
    except ValueError as ve:
        logger.warning(f"Invalid request: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to create maintenance history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create maintenance history: {str(e)}")

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

@router.post("/request/bulk", response_model=List[AssetItem])
async def request_bulk_maintenance(maintenances: List[MaintenanceCreate], collection: Database = Depends(get_maintenance_history_collection)):
    """
    Request maintenance for multiple assets in a single request.
    
    Args:
        maintenances (List[MaintenanceCreate]): List of maintenance request details
        collection (Database): MongoDB maintenance history collection, injected via dependency.
    
    Returns:
        List[AssetItem]: List of updated assets with new maintenance records
    
    Raises:
        HTTPException: 400 for validation errors, 500 for server errors
    """
    logger.info(f"Requesting maintenance for {len(maintenances)} assets in bulk")
    
    updated_assets = []
    errors = []
    
    for idx, maintenance in enumerate(maintenances):
        try:
            logger.debug(f"Processing maintenance request {idx+1}/{len(maintenances)}: asset {maintenance.asset_id}")
            updated_asset = request_maintenance(collection, maintenance)
            updated_assets.append(updated_asset)
            logger.debug(f"Successfully requested maintenance for asset: {maintenance.asset_id}")
        except Exception as e:
            logger.error(f"Failed to request maintenance {idx+1}: {str(e)}", exc_info=True)
            errors.append(f"Maintenance {idx+1} (Asset {maintenance.asset_id}): {str(e)}")
    
    if errors and not updated_assets:
        # If all maintenance requests failed, return 400 with error details
        raise HTTPException(status_code=400, detail={"message": "All maintenance requests failed", "errors": errors})
    
    if errors:
        # If some maintenance requests failed but others succeeded, log the errors
        logger.warning(f"Some maintenance requests failed: {errors}")
    
    logger.info(f"Successfully requested maintenance for {len(updated_assets)} out of {len(maintenances)} assets")
    return updated_assets

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

@router.get("", response_model=List[MaintenanceResponse])
async def read_all_maintenance_history(collection: Database = Depends(get_maintenance_history_collection)):
    """
    Retrieve all maintenance history entries.
    
    Args:
        collection (Database): MongoDB maintenance history collection, injected via dependency.
    
    Returns:
        List[MaintenanceResponse]: List of all maintenance history entries.
    
    Raises:
        HTTPException: 500 for server errors.
    """
    logger.info("Fetching all maintenance history entries")
    try:
        history = get_all_maintenance_history(collection)
        logger.debug(f"Fetched {len(history)} maintenance history entries")
        return history
    except Exception as e:
        logger.error(f"Failed to fetch maintenance history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch maintenance history: {str(e)}")