from fastapi import APIRouter, HTTPException, Depends, status
from pymongo.database import Database
from typing import List, Optional
from app.dependencies import get_db, get_asset_categories_collection
from app.models.asset_category import AssetCategory, AssetCategoryCreate, AssetCategoryUpdate, AssetCategoryResponse
from app.services.asset_category_service import (
    get_asset_categories,
    get_asset_category_by_id,
    create_asset_category,
    update_asset_category,
    delete_asset_category
)
import logging
from pymongo.collection import Collection

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/asset-categories", tags=["Asset Categories"])

@router.get("/", response_model=List[AssetCategoryResponse])
async def read_asset_categories(
    category_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    collection: Collection = Depends(get_asset_categories_collection)
):
    """
    Retrieve all asset categories with optional filters for category_type and is_active.
    Includes computed fields like total_assets, assigned_assets, under_maintenance, and total_cost.
    
    Args:
        category_type (Optional[str]): Filter by category type
        is_active (Optional[bool]): Filter by active status
        collection (Collection): MongoDB asset_categories collection, injected via dependency
        
    Returns:
        List[AssetCategoryResponse]: List of asset categories matching the filters
        
    Raises:
        HTTPException: 500 for server errors
    """
    logger.info(f"Fetching asset categories - category_type: {category_type}, is_active: {is_active}")
    try:
        filters = {}
        if category_type:
            filters["category_type"] = category_type
        if is_active is not None:
            filters["is_active"] = is_active
            
        categories = get_asset_categories(collection, filters)
        logger.debug(f"Fetched {len(categories)} categories")
        return categories
    except Exception as e:
        logger.error(f"Failed to fetch categories: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")

@router.get("/{category_id}", response_model=AssetCategoryResponse)
async def read_asset_category(category_id: str, collection: Collection = Depends(get_asset_categories_collection)):
    """
    Retrieve a specific asset category by ID with computed statistics.
    
    Args:
        category_id (str): Asset category ID
        collection (Collection): MongoDB asset_categories collection, injected via dependency
        
    Returns:
        AssetCategoryResponse: Asset category details
        
    Raises:
        HTTPException: 404 if category not found, 400 for invalid ID, 500 for server errors
    """
    logger.info(f"Fetching asset category with ID: {category_id}")
    try:
        category = get_asset_category_by_id(collection, category_id)
        if not category:
            logger.warning(f"Category not found: {category_id}")
            raise HTTPException(status_code=404, detail="Asset category not found")
            
        logger.debug(f"Found category: {category.category_name}")
        return category
    except ValueError as ve:
        logger.warning(f"Invalid category ID: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to fetch category {category_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch category: {str(e)}")

@router.post("/", response_model=AssetCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_new_asset_category(category: AssetCategoryCreate, collection: Database = Depends(get_asset_categories_collection)):
    """
    Create a new asset category with specified policies and attributes.
    
    Args:
        category (AssetCategoryCreate): Asset category details
        collection (Collection): MongoDB asset_categories collection, injected via dependency
        
    Returns:
        AssetCategoryResponse: Created asset category
        
    Raises:
        HTTPException: 400 for validation errors, 500 for server errors
    """
    logger.info(f"Creating asset category: {category.category_name}")
    try:
        created_category = create_asset_category(collection, category)
        logger.debug(f"Created category with ID: {created_category.id}")
        return created_category
    except ValueError as ve:
        logger.warning(f"Failed to create category: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to create category: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")

@router.post("/bulk", response_model=List[AssetCategoryResponse], status_code=status.HTTP_201_CREATED)
async def create_bulk_asset_categories(categories: List[AssetCategoryCreate], collection: Database = Depends(get_asset_categories_collection)):
    """
    Create multiple asset categories in a single request.
    
    Args:
        categories (List[AssetCategoryCreate]): List of asset categories to create
        collection (Collection): MongoDB asset_categories collection, injected via dependency
        
    Returns:
        List[AssetCategoryResponse]: List of created asset categories
        
    Raises:
        HTTPException: 400 for validation errors, 500 for server errors
    """
    logger.info(f"Creating {len(categories)} asset categories in bulk")
    
    created_categories = []
    errors = []
    
    for idx, category in enumerate(categories):
        try:
            logger.debug(f"Creating category {idx+1}/{len(categories)}: {category.category_name}")
            created_category = create_asset_category(collection, category)
            created_categories.append(created_category)
            logger.debug(f"Successfully created category: {created_category.id}")
        except Exception as e:
            logger.error(f"Failed to create category {idx+1}: {str(e)}", exc_info=True)
            errors.append(f"Category {idx+1} ({category.category_name}): {str(e)}")
    
    if errors and not created_categories:
        # If all categories failed, return 400 with error details
        raise HTTPException(status_code=400, detail={"message": "All categories failed to create", "errors": errors})
    
    if errors:
        # If some categories failed but others succeeded, log the errors
        logger.warning(f"Some categories failed to create: {errors}")
    
    logger.info(f"Successfully created {len(created_categories)} out of {len(categories)} categories")
    return created_categories

@router.put("/{category_id}", response_model=AssetCategoryResponse)
async def update_existing_asset_category(category_id: str, category: AssetCategoryUpdate, collection: Collection = Depends(get_asset_categories_collection)):
    """
    Update an existing asset category.
    
    Args:
        category_id (str): Asset category ID to update
        category (AssetCategoryUpdate): Updated category details
        collection (Collection): MongoDB asset_categories collection, injected via dependency
        
    Returns:
        AssetCategoryResponse: Updated asset category
        
    Raises:
        HTTPException: 404 if category not found, 400 for validation errors, 500 for server errors
    """
    logger.info(f"Updating asset category with ID: {category_id}")
    try:
        updated_category = update_asset_category(collection, category_id, category)
        if not updated_category:
            logger.warning(f"Category not found: {category_id}")
            raise HTTPException(status_code=404, detail="Asset category not found")
            
        logger.debug(f"Updated category: {updated_category.category_name}")
        return updated_category
    except ValueError as ve:
        logger.warning(f"Failed to update category: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to update category {category_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update category: {str(e)}")

@router.delete("/{category_id}", response_model=dict)
async def delete_existing_asset_category(category_id: str, collection: Collection = Depends(get_asset_categories_collection)):
    """
    Delete an asset category if no assets are associated.
    
    Args:
        category_id (str): Asset category ID to delete
        collection (Collection): MongoDB asset_categories collection, injected via dependency
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: 404 if category not found, 400 if category has assets, 500 for server errors
    """
    logger.info(f"Deleting asset category with ID: {category_id}")
    try:
        deleted = delete_asset_category(collection, category_id)
        if not deleted:
            logger.warning(f"Category not found: {category_id}")
            raise HTTPException(status_code=404, detail="Asset category not found")
            
        logger.debug(f"Deleted category ID: {category_id}")
        return {"message": "Asset category deleted successfully"}
    except ValueError as ve:
        logger.warning(f"Cannot delete category: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to delete category {category_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")