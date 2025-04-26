
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from app.models.asset_category import AssetCategory, AssetCategoryCreate
import logging

logger = logging.getLogger(__name__)

def get_asset_categories(db: Database) -> List[AssetCategory]:
    """
    Retrieve all asset categories with statistics.
    """
    logger.info("Fetching all asset categories")
    try:
        categories = list(db.asset_categories.find())
        result = []
        for cat in categories:
            count = db.asset_items.count_documents({"category_id": str(cat["_id"])})
            total_value = sum(
                item["purchase_cost"] for item in db.asset_items.find({"category_id": str(cat["_id"])})
            )
            assigned_count = db.asset_items.count_documents({"category_id": str(cat["_id"]), "has_active_assignment": True})
            maintenance_count = db.asset_items.count_documents({"category_id": str(cat["_id"]), "status": "Under Maintenance"})
            utilization_rate = (
                db.asset_items.count_documents({"category_id": str(cat["_id"]), "is_operational": True}) /
                count * 100
            ) if count > 0 else 0.0
            cat_dict = {
                **cat,
                "id": str(cat["_id"]),
                "_id": str(cat["_id"]),
                "count": count,
                "total_value": total_value,
                "assigned_count": assigned_count,
                "maintenance_count": maintenance_count,
                "utilization_rate": round(utilization_rate, 2)
            }
            result.append(AssetCategory(**cat_dict))
        logger.debug(f"Fetched {len(result)} categories")
        return result
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}", exc_info=True)
        raise

def get_asset_category_by_id(db: Database, id: str) -> Optional[AssetCategory]:
    """
    Retrieve a specific asset category by ID with statistics.
    """
    logger.info(f"Fetching asset category ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid category ID")
        
        category = db.asset_categories.find_one({"_id": ObjectId(id)})
        if not category:
            logger.warning(f"Category not found: {id}")
            return None
        
        count = db.asset_items.count_documents({"category_id": id})
        total_value = sum(
            item["purchase_cost"] for item in db.asset_items.find({"category_id": id})
        )
        assigned_count = db.asset_items.count_documents({"category_id": id, "has_active_assignment": True})
        maintenance_count = db.asset_items.count_documents({"category_id": id, "status": "Under Maintenance"})
        utilization_rate = (
            db.asset_items.count_documents({"category_id": id, "is_operational": True}) /
            count * 100
        ) if count > 0 else 0.0
        
        cat_dict = {
            **category,
            "id": str(category["_id"]),
            "_id": str(category["_id"]),
            "count": count,
            "total_value": total_value,
            "assigned_count": assigned_count,
            "maintenance_count": maintenance_count,
            "utilization_rate": round(utilization_rate, 2)
        }
        result = AssetCategory(**cat_dict)
        logger.debug(f"Fetched category: {result.name}")
        return result
    except Exception as e:
        logger.error(f"Error fetching category {id}: {str(e)}", exc_info=True)
        raise

def create_asset_category(db: Database, category: AssetCategoryCreate) -> AssetCategory:
    """
    Create a new asset category with validation.
    """
    logger.info(f"Creating category: {category.name}")
    try:
        existing = db.asset_categories.find_one({"name": category.name})
        if existing:
            logger.warning(f"Category already exists: {category.name}")
            raise ValueError(f"Category '{category.name}' already exists")
        
        category_dict = category.dict(exclude_none=True)
        category_dict["is_active"] = category_dict.get("is_active", 1)
        category_dict["is_reassignable"] = category_dict.get("is_reassignable", 0)
        category_dict["is_consumable"] = category_dict.get("is_consumable", 0)
        category_dict["requires_maintenance"] = category_dict.get("requires_maintenance", 0)
        category_dict["allow_multiple_assignments"] = category_dict.get("allow_multiple_assignments", 0)
        category_dict["save_as_template"] = category_dict.get("save_as_template", 0)
        category_dict["policies"] = category_dict.get("policies", [
            f"max_assignments: 1",
            f"assignable_to: {category.assignable_to or 'None'}",
            f"assignment_duration: {category.assignment_duration or 'None'} {category.duration_unit or ''}"
        ])
        category_dict["status"] = category_dict.get("status", "Active" if category_dict["is_active"] == 1 else "Inactive")
        category_dict["count"] = 0
        category_dict["total_value"] = 0.0
        category_dict["assigned_count"] = 0
        category_dict["maintenance_count"] = 0
        category_dict["utilization_rate"] = 0.0
        category_dict["created_at"] = datetime.utcnow()
        
        result = db.asset_categories.insert_one(category_dict)
        logger.debug(f"Inserted category: {category.name} with ID: {result.inserted_id}")
        
        response_dict = {
            **category_dict,
            "id": str(result.inserted_id),
            "_id": str(result.inserted_id)
        }
        created_category = AssetCategory(**response_dict)
        logger.info(f"Created category with ID: {created_category.id}")
        return created_category
    except DuplicateKeyError:
        logger.warning(f"Category already exists: {category.name}")
        raise ValueError(f"Category '{category.name}' already exists")
    except Exception as e:
        logger.error(f"Error creating category: {str(e)}", exc_info=True)
        raise

def update_asset_category(db: Database, id: str, category: AssetCategoryCreate) -> Optional[AssetCategory]:
    """
    Update an existing asset category.
    """
    logger.info(f"Updating category ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid category ID")
        
        existing = db.asset_categories.find_one({"name": category.name, "_id": {"$ne": ObjectId(id)}})
        if existing:
            logger.warning(f"Category name already taken: {category.name}")
            raise ValueError(f"Category name '{category.name}' already exists")
        
        category_dict = category.dict(exclude_unset=True)
        category_dict["is_active"] = category_dict.get("is_active", 1)
        category_dict["is_reassignable"] = category_dict.get("is_reassignable", 0)
        category_dict["is_consumable"] = category_dict.get("is_consumable", 0)
        category_dict["requires_maintenance"] = category_dict.get("requires_maintenance", 0)
        category_dict["allow_multiple_assignments"] = category_dict.get("allow_multiple_assignments", 0)
        category_dict["save_as_template"] = category_dict.get("save_as_template", 0)
        category_dict["policies"] = category_dict.get("policies", [
            f"max_assignments: 1",
            f"assignable_to: {category.assignable_to or 'None'}",
            f"assignment_duration: {category.assignment_duration or 'None'} {category.duration_unit or ''}"
        ])
        category_dict["status"] = category_dict.get("status", "Active" if category_dict["is_active"] == 1 else "Inactive")
        category_dict["updated_at"] = datetime.utcnow()
        
        result = db.asset_categories.update_one(
            {"_id": ObjectId(id)},
            {"$set": category_dict}
        )
        if result.matched_count == 0:
            logger.warning(f"Category not found: {id}")
            return None
        
        updated = db.asset_categories.find_one({"_id": ObjectId(id)})
        updated_category = AssetCategory(**{**updated, "id": str(updated["_id"]), "_id": str(updated["_id"])})
        logger.debug(f"Updated category: {updated_category.name}")
        return updated_category
    except DuplicateKeyError:
        logger.warning(f"Category name already taken: {category.name}")
        raise ValueError(f"Category name '{category.name}' already exists")
    except Exception as e:
        logger.error(f"Error updating category {id}: {str(e)}", exc_info=True)
        raise

def delete_asset_category(db: Database, id: str) -> bool:
    """
    Delete an asset category if no assets are associated.
    """
    logger.info(f"Deleting category ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid category ID")
        
        asset_count = db.asset_items.count_documents({"category_id": id})
        if asset_count > 0:
            logger.warning(f"Cannot delete category {id}: {asset_count} assets associated")
            raise ValueError(f"Cannot delete category with {asset_count} associated assets")
        
        result = db.asset_categories.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            logger.warning(f"Category not found: {id}")
            return False
        
        logger.debug(f"Deleted category ID: {id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting category {id}: {str(e)}", exc_info=True)
        raise
