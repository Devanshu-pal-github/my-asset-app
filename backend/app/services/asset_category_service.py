from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError, OperationFailure
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from app.models.asset_category import AssetCategory, AssetCategoryCreate
import logging

logger = logging.getLogger(__name__)

def get_asset_categories(collection: Collection) -> List[AssetCategory]:
    """
    Retrieve all asset categories with statistics.
    """
    logger.info("Fetching all asset categories")
    try:
        categories = list(collection.find())
        result = []
        for cat in categories:
            count = collection.database["asset_items"].count_documents({"category_id": str(cat["_id"])})
            total_cost = sum(
                item["purchase_cost"] for item in collection.database["asset_items"].find({"category_id": str(cat["_id"])})
            )
            assigned_count = collection.database["asset_items"].count_documents({"category_id": str(cat["_id"]), "has_active_assignment": True})
            maintenance_count = collection.database["asset_items"].count_documents({"category_id": str(cat["_id"]), "status": "Under Maintenance"})
            utilization_rate = (
                collection.database["asset_items"].count_documents({"category_id": str(cat["_id"]), "is_operational": True}) /
                count * 100
            ) if count > 0 else 0.0
            cat_dict = {
                **cat,
                "id": str(cat["_id"]),
                "_id": str(cat["_id"]),
                "category_name": cat.get("category_name", ""),
                "total_assets": count,
                "total_cost": total_cost,
                "assigned_assets": assigned_count,
                "under_maintenance": maintenance_count,
                "utilization_rate": round(utilization_rate, 2)
            }
            result.append(AssetCategory(**cat_dict))
        logger.debug(f"Fetched {len(result)} categories")
        return result
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}", exc_info=True)
        raise

def get_asset_category_by_id(collection: Collection, id: str) -> Optional[AssetCategory]:
    """
    Retrieve a specific asset category by ID with statistics.
    """
    logger.info(f"Fetching asset category ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid category ID")
        
        category = collection.find_one({"_id": ObjectId(id)})
        if not category:
            logger.warning(f"Category not found: {id}")
            return None
        
        count = collection.database["asset_items"].count_documents({"category_id": id})
        total_cost = sum(
            item["purchase_cost"] for item in collection.database["asset_items"].find({"category_id": id})
        )
        assigned_count = collection.database["asset_items"].count_documents({"category_id": id, "has_active_assignment": True})
        maintenance_count = collection.database["asset_items"].count_documents({"category_id": id, "status": "Under Maintenance"})
        utilization_rate = (
            collection.database["asset_items"].count_documents({"category_id": id, "is_operational": True}) /
            count * 100
        ) if count > 0 else 0.0
        
        cat_dict = {
            **category,
            "id": str(category["_id"]),
            "_id": str(category["_id"]),
            "category_name": category.get("category_name", ""),
            "total_assets": count,
            "total_cost": total_cost,
            "assigned_assets": assigned_count,
            "under_maintenance": maintenance_count,
            "utilization_rate": round(utilization_rate, 2)
        }
        result = AssetCategory(**cat_dict)
        logger.debug(f"Fetched category: {result.category_name}")
        return result
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error fetching category {id}: {str(e)}", exc_info=True)
        raise

def create_asset_category(collection: Collection, category: AssetCategoryCreate) -> AssetCategory:
    """
    Create a new asset category with validation.
    """
    logger.info(f"Creating category: {category.category_name}")
    try:
        existing = collection.find_one({"category_name": category.category_name})
        if existing:
            logger.warning(f"Category already exists: {category.category_name}")
            raise ValueError(f"Category '{category.category_name}' already exists")
        
        category_dict = category.dict(exclude_none=True)
        category_dict["is_active"] = category_dict.get("is_active", True)
        category_dict["can_be_assigned_reassigned"] = category_dict.get("can_be_assigned_reassigned", False)
        category_dict["is_consumable"] = category_dict.get("is_consumable", False)
        category_dict["maintenance_required"] = category_dict.get("maintenance_required", False)
        category_dict["allow_multiple_assignments"] = category_dict.get("allow_multiple_assignments", False)
        category_dict["save_as_template"] = category_dict.get("save_as_template", False)
        category_dict["policies"] = category.policies if category.policies else [
            f"max_assignments: {category.max_assignments or 1}",
            f"assignable_to: {category.can_be_assigned_to or 'None'}",
            f"assignment_duration: {category.default_assignment_duration or 'None'} {category.assignment_duration_unit or ''}"
        ]
        category_dict["status"] = "Active" if category_dict["is_active"] else "Inactive"
        category_dict["total_assets"] = 0
        category_dict["total_cost"] = 0.0
        category_dict["assigned_assets"] = 0
        category_dict["under_maintenance"] = 0
        category_dict["utilization_rate"] = 0.0
        category_dict["created_at"] = datetime.utcnow()
        
        result = collection.insert_one(category_dict)
        logger.debug(f"Inserted category: {category.category_name} with ID: {result.inserted_id}")
        
        response_dict = {
            **category_dict,
            "id": str(result.inserted_id),
            "_id": str(result.inserted_id),
            "category_name": category_dict.get("category_name", "")
        }
        created_category = AssetCategory(**response_dict)
        logger.info(f"Created category with ID: {created_category.id}")
        return created_category
    except DuplicateKeyError:
        logger.warning(f"Category already exists: {category.category_name}")
        raise ValueError(f"Category '{category.category_name}' already exists")
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error creating category: {str(e)}", exc_info=True)
        raise

def update_asset_category(collection: Collection, id: str, category: AssetCategoryCreate) -> Optional[AssetCategory]:
    """
    Update an existing asset category.
    """
    logger.info(f"Updating category ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid category ID")
        
        existing = collection.find_one({"category_name": category.category_name, "_id": {"$ne": ObjectId(id)}})
        if existing:
            logger.warning(f"Category name already taken: {category.category_name}")
            raise ValueError(f"Category name '{category.category_name}' already exists")
        
        category_dict = category.dict(exclude_unset=True)
        if "is_active" in category_dict:
            category_dict["is_active"] = bool(category_dict["is_active"])
        if "can_be_assigned_reassigned" in category_dict:
            category_dict["can_be_assigned_reassigned"] = bool(category_dict["can_be_assigned_reassigned"])
        if "is_consumable" in category_dict:
            category_dict["is_consumable"] = bool(category_dict["is_consumable"])
        if "maintenance_required" in category_dict:
            category_dict["maintenance_required"] = bool(category_dict["maintenance_required"])
        if "allow_multiple_assignments" in category_dict:
            category_dict["allow_multiple_assignments"] = bool(category_dict["allow_multiple_assignments"])
        if "save_as_template" in category_dict:
            category_dict["save_as_template"] = bool(category_dict["save_as_template"])
        if "policies" in category_dict:
            category_dict["policies"] = category.policies if category.policies else [
                f"max_assignments: {category.max_assignments or 1}",
                f"assignable_to: {category.can_be_assigned_to or 'None'}",
                f"assignment_duration: {category.default_assignment_duration or 'None'} {category.assignment_duration_unit or ''}"
            ]
        category_dict["status"] = "Active" if category_dict.get("is_active", True) else "Inactive"
        category_dict["updated_at"] = datetime.utcnow()
        
        result = collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": category_dict}
        )
        if result.matched_count == 0:
            logger.warning(f"Category not found: {id}")
            return None
        
        updated = collection.find_one({"_id": ObjectId(id)})
        count = collection.database["asset_items"].count_documents({"category_id": id})
        total_cost = sum(
            item["purchase_cost"] for item in collection.database["asset_items"].find({"category_id": id})
        )
        assigned_count = collection.database["asset_items"].count_documents({"category_id": id, "has_active_assignment": True})
        maintenance_count = collection.database["asset_items"].count_documents({"category_id": id, "status": "Under Maintenance"})
        utilization_rate = (
            collection.database["asset_items"].count_documents({"category_id": id, "is_operational": True}) /
            count * 100
        ) if count > 0 else 0.0
        
        updated_dict = {
            **updated,
            "id": str(updated["_id"]),
            "_id": str(updated["_id"]),
            "category_name": updated.get("category_name", ""),
            "total_assets": count,
            "total_cost": total_cost,
            "assigned_assets": assigned_count,
            "under_maintenance": maintenance_count,
            "utilization_rate": round(utilization_rate, 2)
        }
        updated_category = AssetCategory(**updated_dict)
        logger.debug(f"Updated category: {updated_category.category_name}")
        return updated_category
    except DuplicateKeyError:
        logger.warning(f"Category name already taken: {category.category_name}")
        raise ValueError(f"Category name '{category.category_name}' already exists")
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error updating category {id}: {str(e)}", exc_info=True)
        raise

def delete_asset_category(collection: Collection, id: str) -> bool:
    """
    Delete an asset category if no assets are associated.
    """
    logger.info(f"Deleting category ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid category ID")
        
        asset_count = collection.database["asset_items"].count_documents({"category_id": id})
        if asset_count > 0:
            logger.warning(f"Cannot delete category {id}: {asset_count} assets associated")
            raise ValueError(f"Cannot delete category with {asset_count} associated assets")
        
        result = collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            logger.warning(f"Category not found: {id}")
            return False
        
        logger.debug(f"Deleted category ID: {id}")
        return True
    except OperationFailure as e:
        logger.error(f"Database operation failed: {str(e)}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"Error deleting category {id}: {str(e)}", exc_info=True)
        raise