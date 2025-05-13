from fastapi import APIRouter, HTTPException, Depends, Query
from pymongo.collection import Collection
from typing import List, Optional
from datetime import datetime
from app.dependencies import get_db
from app.models.asset_item import AssetItem, AssetItemCreate, AssetItemUpdate, AssetStatus, AssetCondition
from app.services.asset_item_service import (
    get_asset_items,
    get_asset_item_by_id,
    create_asset_item,
    update_asset_item,
    delete_asset_item,
    get_asset_statistics
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/asset-items", tags=["Asset Items"])

@router.get("/", response_model=List[AssetItem])
async def read_asset_items(
    category_id: Optional[str] = None,
    status: Optional[AssetStatus] = None,
    has_active_assignment: Optional[bool] = None,
    serial_number: Optional[str] = None,
    asset_tag: Optional[str] = None,
    department: Optional[str] = None,
    location: Optional[str] = None,
    maintenance_due_before: Optional[str] = None,
    requires_maintenance: Optional[bool] = None,
    is_active: Optional[bool] = None,
    tags: Optional[List[str]] = Query(None),
    db: Collection = Depends(get_db)
):
    """
    Retrieve asset items with optional filters for category, status, assignment, serial number, department, location, or maintenance due date.
    """
    logger.info(f"Fetching asset items - category_id: {category_id}, status: {status}, has_active_assignment: {has_active_assignment}, serial_number: {serial_number}, asset_tag: {asset_tag}, department: {department}, location: {location}, maintenance_due_before: {maintenance_due_before}")
    try:
        query = {}
        if category_id:
            query["category_id"] = category_id
        if status:
            query["status"] = status
        if has_active_assignment is not None:
            query["has_active_assignment"] = has_active_assignment
        if serial_number:
            query["serial_number"] = serial_number
        if asset_tag:
            query["asset_tag"] = asset_tag
        if department:
            query["department"] = department
        if location:
            query["location"] = location
        if requires_maintenance is not None:
            query["requires_maintenance"] = requires_maintenance
        if is_active is not None:
            query["is_active"] = is_active
        if tags:
            query["tags"] = {"$in": tags}
        if maintenance_due_before:
            try:
                due_date = datetime.fromisoformat(maintenance_due_before.replace("Z", "+00:00"))
                query["maintenance_due_date"] = {"$lte": due_date}
            except ValueError:
                logger.warning(f"Invalid maintenance_due_before format: {maintenance_due_before}")
                raise HTTPException(status_code=400, detail="Invalid maintenance_due_before format; use ISO 8601")
        
        items = get_asset_items(db, query)
        logger.debug(f"Fetched {len(items)} asset items")
        return items
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch asset items: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch asset items: {str(e)}")

@router.get("/statistics", response_model=dict)
async def read_asset_statistics(db: Collection = Depends(get_db)):
    """
    Retrieve statistics for assets (total, assigned, unassigned, under maintenance, utilization rate).
    """
    logger.info("Fetching asset statistics")
    try:
        stats = get_asset_statistics(db)
        logger.debug(f"Asset statistics: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Failed to fetch asset statistics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch asset statistics: {str(e)}")

@router.get("/{id}", response_model=AssetItem)
async def read_asset_item(id: str, db: Collection = Depends(get_db)):
    """
    Retrieve a specific asset item by ID.
    """
    logger.info(f"Fetching asset item with ID: {id}")
    try:
        item = get_asset_item_by_id(db, id)
        if not item:
            logger.warning(f"Asset item not found: {id}")
            raise HTTPException(status_code=404, detail="Asset item not found")
        logger.debug(f"Found asset item: {item.name}")
        return item
    except ValueError as ve:
        logger.warning(f"Invalid asset ID: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to fetch asset item {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch asset item: {str(e)}")

@router.post("/", response_model=AssetItem)
async def create_new_asset_item(item: AssetItemCreate, db: Collection = Depends(get_db)):
    """
    Create a new asset item with validation for category, status, and specifications.
    """
    logger.info(f"Creating asset item: {item.name}")
    try:
        if item.specifications and not isinstance(item.specifications, dict):
            logger.warning("Invalid specifications format")
            raise HTTPException(status_code=400, detail="Specifications must be a key-value dictionary")
        created_item = create_asset_item(db, item)
        logger.debug(f"Created asset item with ID: {created_item.id}")
        return created_item
    except ValueError as ve:
        logger.warning(f"Failed to create asset item: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to create asset item: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create asset item: {str(e)}")

@router.put("/{id}", response_model=AssetItem)
async def update_existing_asset_item(id: str, item: AssetItemUpdate, db: Collection = Depends(get_db)):
    """
    Update an existing asset item.
    """
    logger.info(f"Updating asset item with ID: {id}")
    try:
        if item.specifications and not isinstance(item.specifications, dict):
            logger.warning("Invalid specifications format")
            raise HTTPException(status_code=400, detail="Specifications must be a key-value dictionary")
        updated_item = update_asset_item(db, id, item)
        if not updated_item:
            logger.warning(f"Asset item not found: {id}")
            raise HTTPException(status_code=404, detail="Asset item not found")
        logger.debug(f"Updated asset item: {updated_item.name}")
        return updated_item
    except ValueError as ve:
        logger.warning(f"Failed to update asset item: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to update asset item {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update asset item: {str(e)}")

@router.delete("/{id}", response_model=dict)
async def delete_existing_asset_item(id: str, db: Collection = Depends(get_db)):
    """
    Delete an asset item if not assigned.
    """
    logger.info(f"Deleting asset item with ID: {id}")
    try:
        deleted = delete_asset_item(db, id)
        if not deleted:
            logger.warning(f"Asset item not found: {id}")
            raise HTTPException(status_code=404, detail="Asset item not found")
        logger.debug(f"Deleted asset item ID: {id}")
        return {"message": "Asset item deleted successfully"}
    except ValueError as ve:
        logger.warning(f"Cannot delete asset item: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to delete asset item {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete asset item: {str(e)}")