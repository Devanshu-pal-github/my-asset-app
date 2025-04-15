from fastapi import APIRouter, HTTPException
from app.dependencies import db
from app.models.asset_category import AssetCategory, AssetCategoryCreate, AssetCategoryBase
from app.services.asset_category_service import create_asset_category, get_asset_categories, update_asset_category, delete_asset_category
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/asset-categories", tags=["Asset Categories"], redirect_slashes=False)

@router.get("/", response_model=List[AssetCategory])
def read_asset_categories():
    logger.debug("Fetching all asset categories")
    try:
        categories = get_asset_categories(db)
        logger.debug(f"Fetched {len(categories)} asset categories: {categories}")
        return categories if categories is not None else []
    except Exception as e:
        logger.error(f"Error fetching asset categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch asset categories")

@router.post("/", response_model=AssetCategory)
def create_new_asset_category(category: AssetCategoryCreate):
    logger.debug(f"Creating asset category: {category.name}")
    try:
        return create_asset_category(db, category)
    except Exception as e:
        logger.error(f"Error creating asset category: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to create asset category")

@router.put("/{id}", response_model=AssetCategory)
def update_asset_category_route(id: str, category: AssetCategoryBase):
    logger.debug(f"Updating asset category with ID: {id}")
    try:
        updated_category = update_asset_category(db, id, category)
        if not updated_category:
            logger.warning(f"Asset category with ID {id} not found")
            raise HTTPException(status_code=404, detail="Asset category not found")
        logger.debug(f"Asset category {id} updated successfully")
        return updated_category
    except Exception as e:
        logger.error(f"Error updating asset category {id}: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to update asset category")

@router.delete("/{id}", response_model=dict)
def delete_asset_category_route(id: str):
    logger.debug(f"Deleting asset category with ID: {id}")
    try:
        deleted = delete_asset_category(db, id)
        if not deleted:
            logger.warning(f"Asset category with ID {id} not found or has associated items")
            raise HTTPException(status_code=404, detail="Asset category not found")
        logger.debug(f"Asset category {id} deleted successfully")
        return {"message": "Asset category deleted successfully"}
    except ValueError as e:
        logger.error(f"Error deleting asset category {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error deleting asset category {id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete asset category")