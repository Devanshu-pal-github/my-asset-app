from pymongo.database import Database
from pymongo.errors import PyMongoError
from bson import ObjectId
from typing import Optional
from datetime import datetime
from app.models.asset_item import AssetItem, AssetStatus
from app.models.maintenance_history import MaintenanceHistoryEntry, MaintenanceRequest, MaintenanceUpdate, MaintenanceStatus
import logging

logger = logging.getLogger(__name__)

def request_maintenance(db: Database, request: MaintenanceRequest) -> AssetItem:
    """
    Request maintenance for an asset, updating its status and adding a maintenance history entry.
    """
    logger.info(f"Requesting maintenance for asset {request.asset_id}")
    try:
        if not ObjectId.is_valid(request.asset_id):
            logger.warning(f"Invalid asset ID: {request.asset_id}")
            raise ValueError("Invalid asset ID")
        
        asset = db.asset_items.find_one({"_id": ObjectId(request.asset_id)})
        if not asset:
            logger.warning(f"Asset not found: {request.asset_id}")
            raise ValueError(f"Asset {request.asset_id} not found")
        
        category = db.asset_categories.find_one({"_id": ObjectId(asset["category_id"])})
        if not category.get("requires_maintenance"):
            logger.warning(f"Maintenance not required for category: {asset['category_id']}")
            raise ValueError("Maintenance not required for this asset category")
        
        maintenance_entry = MaintenanceHistoryEntry(
            id=str(ObjectId()),
            maintenance_type=request.maintenance_type,
            technician=request.technician,
            condition_before=request.condition,
            maintenance_date=datetime.utcnow(),
            status=MaintenanceStatus.REQUESTED,
            cost=request.cost,
            notes=request.notes,
            created_at=datetime.utcnow()
        )
        
        update_result = db.asset_items.update_one(
            {"_id": ObjectId(request.asset_id)},
            {
                "$set": {
                    "status": AssetStatus.MAINTENANCE_REQUESTED,
                    "updated_at": datetime.utcnow()
                },
                "$push": {"maintenance_history": maintenance_entry.dict()}
            }
        )
        
        if update_result.modified_count == 0:
            logger.warning(f"Failed to update asset {request.asset_id}")
            raise ValueError("Failed to update asset")
        
        updated_asset = db.asset_items.find_one({"_id": ObjectId(request.asset_id)})
        updated_item = AssetItem(**{**updated_asset, "id": str(updated_asset["_id"])})
        logger.info(f"Maintenance requested for asset {request.asset_id}, maintenance_id: {maintenance_entry.id}")
        return updated_item
    except PyMongoError as e:
        logger.error(f"Database error in request_maintenance: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error in request_maintenance: {str(e)}", exc_info=True)
        raise ValueError(str(e))

def update_maintenance_status(db: Database, update: MaintenanceUpdate) -> AssetItem:
    """
    Update the maintenance status, updating the asset's status and history.
    """
    logger.info(f"Updating maintenance {update.maintenance_id} for asset {update.asset_id}")
    try:
        if not ObjectId.is_valid(update.asset_id):
            logger.warning(f"Invalid asset ID: {update.asset_id}")
            raise ValueError("Invalid asset ID")
        if not ObjectId.is_valid(update.maintenance_id):
            logger.warning(f"Invalid maintenance ID: {update.maintenance_id}")
            raise ValueError("Invalid maintenance ID")
        
        asset = db.asset_items.find_one({"_id": ObjectId(update.asset_id)})
        if not asset:
            logger.warning(f"Asset not found: {update.asset_id}")
            raise ValueError(f"Asset {update.asset_id} not found")
        
        maintenance_exists = any(entry["id"] == update.maintenance_id for entry in asset.get("maintenance_history", []))
        if not maintenance_exists:
            logger.warning(f"Maintenance {update.maintenance_id} not found for asset {update.asset_id}")
            raise ValueError(f"Maintenance {update.maintenance_id} not found")
        
        update_result = db.asset_items.update_one(
            {
                "_id": ObjectId(update.asset_id),
                "maintenance_history.id": update.maintenance_id
            },
            {
                "$set": {
                    "maintenance_history.$.condition_after": update.condition_after,
                    "maintenance_history.$.completed_date": update.completed_date,
                    "maintenance_history.$.status": MaintenanceStatus.COMPLETED,
                    "maintenance_history.$.notes": update.notes,
                    "status": AssetStatus.AVAILABLE,
                    "is_operational": True,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if update_result.modified_count == 0:
            logger.warning(f"No maintenance request found for {update.maintenance_id}")
            raise ValueError("No maintenance request found or failed to update")
        
        updated_asset = db.asset_items.find_one({"_id": ObjectId(update.asset_id)})
        updated_item = AssetItem(**{**updated_asset, "id": str(updated_asset["_id"])})
        logger.info(f"Maintenance updated for asset {update.asset_id}, maintenance_id: {update.maintenance_id}")
        return updated_item
    except PyMongoError as e:
        logger.error(f"Database error in update_maintenance_status: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error in update_maintenance_status: {str(e)}", exc_info=True)
        raise ValueError(str(e))