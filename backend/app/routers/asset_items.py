from fastapi import APIRouter, HTTPException, Depends, Query
from pymongo.collection import Collection
from typing import List, Optional
from datetime import datetime
from app.dependencies import get_asset_items_collection
from app.models.asset_item import (
    AssetItem, 
    AssetItemCreate, 
    AssetItemUpdate, 
    AssetItemResponse, 
    AssetStatus, 
    AssetCondition
)
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

@router.get("/", response_model=List[AssetItemResponse])
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
    collection: Collection = Depends(get_asset_items_collection)
):
    """
    Retrieve asset items with optional filters for category, status, assignment, serial number, department, location, or maintenance due date.
    
    Args:
        category_id (Optional[str]): Filter by category ID
        status (Optional[AssetStatus]): Filter by asset status
        has_active_assignment (Optional[bool]): Filter by assignment status
        serial_number (Optional[str]): Filter by serial number
        asset_tag (Optional[str]): Filter by asset tag
        department (Optional[str]): Filter by department
        location (Optional[str]): Filter by location
        maintenance_due_before (Optional[str]): Filter by maintenance due date
        requires_maintenance (Optional[bool]): Filter by maintenance requirement
        is_active (Optional[bool]): Filter by active status
        tags (Optional[List[str]]): Filter by tags
        collection (Collection): MongoDB collection instance, injected via dependency
        
    Returns:
        List[AssetItemResponse]: List of asset items matching the filters
        
    Raises:
        HTTPException: 400 for invalid date format, 500 for server errors
    """
    logger.info(f"Fetching asset items - category_id: {category_id}, status: {status}, has_active_assignment: {has_active_assignment}, serial_number: {serial_number}, asset_tag: {asset_tag}, department: {department}, location: {location}, maintenance_due_before: {maintenance_due_before}")
    try:
        filters = {}
        if category_id:
            filters["category_id"] = category_id
        if status:
            filters["status"] = status
        if has_active_assignment is not None:
            filters["has_active_assignment"] = has_active_assignment
        if serial_number:
            filters["serial_number"] = serial_number
        if asset_tag:
            filters["asset_tag"] = asset_tag
        if department:
            filters["department"] = department
        if location:
            filters["location"] = location
        if requires_maintenance is not None:
            filters["requires_maintenance"] = requires_maintenance
        if is_active is not None:
            filters["is_active"] = is_active
        if tags:
            filters["tags"] = {"$in": tags}
        if maintenance_due_before:
            try:
                due_date = datetime.fromisoformat(maintenance_due_before.replace("Z", "+00:00"))
                filters["maintenance_due_date"] = {"$lte": due_date}
            except ValueError:
                logger.warning(f"Invalid maintenance_due_before format: {maintenance_due_before}")
                raise HTTPException(status_code=400, detail="Invalid maintenance_due_before format; use ISO 8601")
        
        items = get_asset_items(collection, filters)
        logger.debug(f"Fetched {len(items)} asset items")
        return items
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch asset items: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch asset items: {str(e)}")

@router.get("/statistics", response_model=dict)
async def read_asset_statistics(collection: Collection = Depends(get_asset_items_collection)):
    """
    Retrieve statistics for assets (total, assigned, unassigned, under maintenance, utilization rate).
    
    Args:
        collection (Collection): MongoDB collection instance, injected via dependency
        
    Returns:
        dict: Asset statistics
        
    Raises:
        HTTPException: 500 for server errors
    """
    logger.info("Fetching asset statistics")
    try:
        stats = get_asset_statistics(collection)
        logger.debug(f"Asset statistics: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Failed to fetch asset statistics: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch asset statistics: {str(e)}")

@router.get("/{asset_id}", response_model=AssetItem)
async def read_asset_item(asset_id: str, collection: Collection = Depends(get_asset_items_collection)):
    """
    Retrieve a specific asset item by ID.
    
    Args:
        asset_id (str): Asset ID
        collection (Collection): MongoDB collection instance, injected via dependency
        
    Returns:
        AssetItem: Asset details
        
    Raises:
        HTTPException: 404 if asset not found, 400 for invalid ID, 500 for server errors
    """
    logger.info(f"Fetching asset item with ID: {asset_id}")
    try:
        item = get_asset_item_by_id(collection, asset_id)
        if not item:
            logger.warning(f"Asset item not found: {asset_id}")
            raise HTTPException(status_code=404, detail="Asset item not found")
            
        logger.debug(f"Found asset item: {item.name}")
        return item
    except ValueError as ve:
        logger.warning(f"Invalid asset ID: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to fetch asset item {asset_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch asset item: {str(e)}")

@router.post("/", response_model=AssetItemResponse)
async def create_new_asset_item(item: AssetItemCreate, collection: Collection = Depends(get_asset_items_collection)):
    """
    Create a new asset item with validation for category, status, and specifications.
    
    Args:
        item (AssetItemCreate): Asset details
        collection (Collection): MongoDB collection instance, injected via dependency
        
    Returns:
        AssetItemResponse: Created asset details
        
    Raises:
        HTTPException: 400 for validation errors, 500 for server errors
    """
    logger.info(f"Creating asset item: {item.name}")
    try:
        created_item = create_asset_item(collection, item)
        logger.debug(f"Created asset item with ID: {created_item.id}")
        return created_item
    except ValueError as ve:
        logger.warning(f"Failed to create asset item: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to create asset item: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create asset item: {str(e)}")

@router.post("/bulk", response_model=List[AssetItemResponse])
async def create_bulk_asset_items(items: List[AssetItemCreate], collection: Collection = Depends(get_asset_items_collection)):
    """
    Create multiple asset items in a single request.
    
    Args:
        items (List[AssetItemCreate]): List of asset items to create
        collection (Collection): MongoDB collection instance, injected via dependency
        
    Returns:
        List[AssetItemResponse]: List of created asset items
        
    Raises:
        HTTPException: 400 for validation errors, 500 for server errors
    """
    logger.info(f"Creating {len(items)} asset items in bulk")
    
    created_items = []
    errors = []
    
    for idx, item in enumerate(items):
        try:
            logger.debug(f"Creating item {idx+1}/{len(items)}: {item.name}")
            created_item = create_asset_item(collection, item)
            created_items.append(created_item)
            logger.debug(f"Successfully created asset item: {created_item.id}")
        except Exception as e:
            logger.error(f"Failed to create asset item {idx+1}: {str(e)}", exc_info=True)
            errors.append(f"Asset item {idx+1} ({item.name}): {str(e)}")
    
    if errors and not created_items:
        # If all items failed, return 400 with error details
        raise HTTPException(status_code=400, detail={"message": "All asset items failed to create", "errors": errors})
    
    if errors:
        # If some items failed but others succeeded, log the errors
        logger.warning(f"Some asset items failed to create: {errors}")
    
    logger.info(f"Successfully created {len(created_items)} out of {len(items)} asset items")
    return created_items

@router.put("/{asset_id}", response_model=AssetItemResponse)
async def update_existing_asset_item(asset_id: str, item: AssetItemUpdate, collection: Collection = Depends(get_asset_items_collection)):
    """
    Update an existing asset item.
    
    Args:
        asset_id (str): Asset ID to update
        item (AssetItemUpdate): Updated asset details
        collection (Collection): MongoDB collection instance, injected via dependency
        
    Returns:
        AssetItemResponse: Updated asset details
        
    Raises:
        HTTPException: 404 if asset not found, 400 for validation errors, 500 for server errors
    """
    logger.info(f"Updating asset item with ID: {asset_id}")
    try:
        updated_item = update_asset_item(collection, asset_id, item)
        if not updated_item:
            logger.warning(f"Asset item not found: {asset_id}")
            raise HTTPException(status_code=404, detail="Asset item not found")
            
        logger.debug(f"Updated asset item: {updated_item.name}")
        return updated_item
    except ValueError as ve:
        logger.warning(f"Failed to update asset item: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to update asset item {asset_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update asset item: {str(e)}")

@router.delete("/{asset_id}", response_model=dict)
async def delete_existing_asset_item(asset_id: str, collection: Collection = Depends(get_asset_items_collection)):
    """
    Delete an asset item if not assigned.
    
    Args:
        asset_id (str): Asset ID to delete
        collection (Collection): MongoDB collection instance, injected via dependency
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 404 if asset not found, 400 if asset is assigned, 500 for server errors
    """
    logger.info(f"Deleting asset item with ID: {asset_id}")
    try:
        deleted = delete_asset_item(collection, asset_id)
        if not deleted:
            logger.warning(f"Asset item not found: {asset_id}")
            raise HTTPException(status_code=404, detail="Asset item not found")
            
        logger.debug(f"Deleted asset item ID: {asset_id}")
        return {"message": "Asset item deleted successfully"}
    except ValueError as ve:
        logger.warning(f"Cannot delete asset item: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to delete asset item {asset_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete asset item: {str(e)}")