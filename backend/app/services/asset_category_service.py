from pymongo.collection import Collection
from app.models.asset_category import AssetCategoryCreate, AssetCategory, AssetCategoryBase
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

def get_asset_categories(db: Collection) -> List[AssetCategory]:
    logger.debug("Executing get_asset_categories")
    try:
        categories = list(db.asset_categories.find())
        logger.debug(f"Raw MongoDB response: {categories}")
        if not isinstance(categories, list):
            logger.warning("MongoDB returned non-list response")
            return []
        processed = [
            AssetCategory(**{**cat, "id": str(cat["_id"])})
            for cat in categories
        ]
        logger.info(f"Successfully fetched {len(processed)} categories")
        return processed
    except Exception as e:
        logger.error(f"Error in get_asset_categories: {str(e)}")
        raise

def create_asset_category(db: Collection, category: AssetCategoryCreate) -> AssetCategory:
    logger.debug(f"Creating category: {category.name}")
    try:
        category_dict = category.dict(exclude_unset=True)  # Only include provided fields
        category_dict["created_at"] = datetime.utcnow()
        category_dict["updated_at"] = datetime.utcnow()
        result = db.asset_categories.insert_one(category_dict)
        logger.info(f"Created category with ID: {result.inserted_id}")
        return AssetCategory(**{**category_dict, "id": str(result.inserted_id)})
    except Exception as e:
        logger.error(f"Error creating category: {str(e)}")
        raise

def update_asset_category(db: Collection, id: str, category: AssetCategoryBase) -> Optional[AssetCategory]:
    logger.debug(f"Updating category with ID: {id}")
    try:
        update_data = category.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        result = db.asset_categories.update_one(
            {"_id": ObjectId(id)},
            {"$set": update_data}
        )
        if result.modified_count == 0:
            logger.warning(f"No category found with ID: {id}")
            return None
        updated_category = db.asset_categories.find_one({"_id": ObjectId(id)})
        logger.info(f"Updated category with ID: {id}")
        return AssetCategory(**{**updated_category, "id": str(updated_category["_id"])})
    except Exception as e:
        logger.error(f"Error updating category {id}: {str(e)}")
        return None

def delete_asset_category(db: Collection, id: str) -> bool:
    logger.debug(f"Deleting category with ID: {id}")
    try:
        item_count = db.asset_items.count_documents({"category_id": id})
        if item_count > 0:
            logger.warning(f"Cannot delete category {id}: {item_count} associated items")
            raise ValueError("Cannot delete category with associated items")
        result = db.asset_categories.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            logger.warning(f"No category found with ID: {id}")
            return False
        logger.info(f"Deleted category with ID: {id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting category {id}: {str(e)}")
        raise