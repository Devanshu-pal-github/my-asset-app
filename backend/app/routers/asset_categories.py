from fastapi import APIRouter, HTTPException, Depends
from pymongo.database import Database
from typing import List, Optional
from app.dependencies import get_db
from app.models.asset_category import AssetCategory, AssetCategoryCreate
from app.services.asset_category_service import (
    get_asset_categories,
    get_asset_category_by_id,
    create_asset_category,
    update_asset_category,
    delete_asset_category
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/asset-categories", tags=["Asset Categories"])

@router.get("/", response_model=List[AssetCategory])
async def read_asset_categories(
    category_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Database = Depends(get_db)
):
    """
    Retrieve all asset categories with optional filters for category_type and is_active.
    Includes computed fields like count, total_value, assigned_count, maintenance_count, and utilization_rate.
    """
    logger.info(f"Fetching asset categories - category_type: {category_type}, is_active: {is_active}")
    try:
        query = {}
        if category_type:
            query["category_type"] = category_type
        if is_active is not None:
            query["is_active"] = is_active
        categories = get_asset_categories(db)
        filtered_categories = [cat for cat in categories if all(cat.dict().get(k) == v for k, v in query.items())]
        logger.debug(f"Fetched {len(filtered_categories)} categories")
        return filtered_categories
    except Exception as e:
        logger.error(f"Failed to fetch categories: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch categories: {str(e)}")

@router.get("/{id}", response_model=AssetCategory)
async def read_asset_category(id: str, db: Database = Depends(get_db)):
    """
    Retrieve a specific asset category by ID with computed statistics.
    """
    logger.info(f"Fetching asset category with ID: {id}")
    try:
        category = get_asset_category_by_id(db, id)
        if not category:
            logger.warning(f"Category not found: {id}")
            raise HTTPException(status_code=404, detail="Asset category not found")
        logger.debug(f"Found category: {category.name}")
        return category
    except ValueError as ve:
        logger.warning(f"Invalid category ID: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to fetch category {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch category: {str(e)}")

@router.post("/", response_model=AssetCategory)
async def create_new_asset_category(category: AssetCategoryCreate, db: Database = Depends(get_db)):
    """
    Create a new asset category with specified policies and attributes.
    """
    logger.info(f"Creating asset category: {category.name}")
    try:
        created_category = create_asset_category(db, category)
        logger.debug(f"Created category with ID: {created_category.id}")
        return created_category
    except ValueError as ve:
        logger.warning(f"Failed to create category: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to create category: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")

@router.put("/{id}", response_model=AssetCategory)
async def update_existing_asset_category(id: str, category: AssetCategoryCreate, db: Database = Depends(get_db)):
    """
    Update an existing asset category.
    """
    logger.info(f"Updating asset category with ID: {id}")
    try:
        updated_category = update_asset_category(db, id, category)
        if not updated_category:
            logger.warning(f"Category not found: {id}")
            raise HTTPException(status_code=404, detail="Asset category not found")
        logger.debug(f"Updated category: {updated_category.name}")
        return updated_category
    except ValueError as ve:
        logger.warning(f"Failed to update category: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to update category {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update category: {str(e)}")

@router.delete("/{id}", response_model=dict)
async def delete_existing_asset_category(id: str, db: Database = Depends(get_db)):
    """
    Delete an asset category if no assets are associated.
    """
    logger.info(f"Deleting asset category with ID: {id}")
    try:
        deleted = delete_asset_category(db, id)
        if not deleted:
            logger.warning(f"Category not found: {id}")
            raise HTTPException(status_code=404, detail="Asset category not found")
        logger.debug(f"Deleted category ID: {id}")
        return {"message": "Asset category deleted successfully"}
    except ValueError as ve:
        logger.warning(f"Cannot delete category: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to delete category {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")