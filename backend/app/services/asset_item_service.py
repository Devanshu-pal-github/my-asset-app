from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from app.models.asset_item import AssetItem, AssetItemCreate, AssetStatus
import logging

logger = logging.getLogger(__name__)

def get_asset_items(
    db: Collection,
    category_id: Optional[str] = None,
    status: Optional[AssetStatus] = None,
    has_active_assignment: Optional[bool] = None,
    serial_number: Optional[str] = None,
    department: Optional[str] = None,
    location: Optional[str] = None,
    maintenance_due_before: Optional[datetime] = None
) -> List[AssetItem]:
    """
    Retrieve asset items with optional filters.
    """
    logger.info(f"Fetching asset items - category_id: {category_id}, status: {status}, has_active_assignment: {has_active_assignment}, serial_number: {serial_number}, department: {department}, location: {location}, maintenance_due_before: {maintenance_due_before}")
    try:
        query = {}
        if category_id:
            query["category_id"] = str(category_id)
        if status:
            query["status"] = status
        if has_active_assignment is not None:
            query["has_active_assignment"] = has_active_assignment
        if serial_number:
            query["serial_number"] = serial_number
        if department:
            query["department"] = department
        if location:
            query["location"] = location
        if maintenance_due_before:
            query["maintenance_due_date"] = {"$lte": maintenance_due_before}
        
        items = list(db.find(query))
        result = []
        for item in items:
            category = db.database["asset_categories"].find_one({"_id": ObjectId(item["category_id"])})
            item_dict = {
                **item,
                "id": str(item["_id"]),
                "_id": str(item["_id"]),
                "category_name": category.get("category_name", "") if category else ""
            }
            result.append(AssetItem(**item_dict))
        
        logger.debug(f"Fetched {len(result)} asset items")
        return result
    except Exception as e:
        logger.error(f"Error fetching asset items: {str(e)}", exc_info=True)
        raise

def get_asset_item_by_id(db: Collection, id: str) -> Optional[AssetItem]:
    """
    Retrieve a specific asset item by ID.
    """
    logger.info(f"Fetching asset item ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid asset ID")
        
        item = db.find_one({"_id": ObjectId(id)})
        if not item:
            logger.warning(f"Asset item not found: {id}")
            return None
        
        category = db.database["asset_categories"].find_one({"_id": ObjectId(item["category_id"])})
        item_dict = {
            **item,
            "id": str(item["_id"]),
            "_id": str(item["_id"]),
            "category_name": category.get("category_name", "") if category else ""
        }
        asset_item = AssetItem(**item_dict)
        logger.debug(f"Fetched asset item: {asset_item.name}")
        return asset_item
    except Exception as e:
        logger.error(f"Error fetching asset item {id}: {str(e)}", exc_info=True)
        raise

def create_asset_item(db: Collection, item: AssetItemCreate) -> AssetItem:
    """
    Create a new asset item with validation.
    """
    logger.info(f"Creating asset item: {item.name}")
    try:
        if not ObjectId.is_valid(item.category_id):
            logger.warning(f"Invalid category ID: {item.category_id}")
            raise ValueError("Invalid category ID")
        
        category = db.database["asset_categories"].find_one({"_id": ObjectId(item.category_id)})
        if not category:
            logger.warning(f"Category not found: {item.category_id}")
            raise ValueError("Category not found")
        
        existing = db.find_one({"$or": [{"asset_id": item.asset_id}, {"serial_number": item.serial_number}]})
        if existing:
            logger.warning(f"Duplicate found: asset_id={existing.get('asset_id')}, serial_number={existing.get('serial_number')}")
            raise ValueError(f"Asset ID '{item.asset_id}' or serial number '{item.serial_number}' already exists")
        
        if item.status == AssetStatus.RETIRED:
            logger.warning("Cannot create asset with RETIRED status")
            raise ValueError("Cannot create asset with RETIRED status")
        
        item_dict = item.dict(exclude_none=True)
        item_dict["has_active_assignment"] = False
        item_dict["is_operational"] = item.status in [AssetStatus.AVAILABLE, AssetStatus.ASSIGNED]
        item_dict["current_value"] = item.purchase_cost
        item_dict["created_at"] = datetime.utcnow()
        item_dict["assignment_history"] = []
        item_dict["maintenance_history"] = []
        item_dict["documents"] = []
        
        result = db.insert_one(item_dict)
        logger.debug(f"Inserted asset item: {item.name} with ID: {result.inserted_id}")
        
        response_dict = {
            **item_dict,
            "id": str(result.inserted_id),
            "_id": str(result.inserted_id),
            "category_name": category.get("category_name", "")
        }
        created_item = AssetItem(**response_dict)
        logger.info(f"Created asset item with ID: {created_item.id}")
        return created_item
    except DuplicateKeyError:
        logger.warning(f"Duplicate found: asset_id={item.asset_id}, serial_number={item.serial_number}")
        raise ValueError(f"Asset ID '{item.asset_id}' or serial number '{item.serial_number}' already exists")
    except Exception as e:
        logger.error(f"Error creating asset item: {str(e)}", exc_info=True)
        raise

def update_asset_item(db: Collection, id: str, item: AssetItemCreate) -> Optional[AssetItem]:
    """
    Update an existing asset item.
    """
    logger.info(f"Updating asset item ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid asset ID")
        
        existing = db.find_one({"_id": ObjectId(id)})
        if not existing:
            logger.warning(f"Asset item not found: {id}")
            return None
        
        category = db.database["asset_categories"].find_one({"_id": ObjectId(item.category_id)})
        if not category:
            logger.warning(f"Category not found: {item.category_id}")
            raise ValueError("Category not found")
        
        existing_tag = db.find_one(
            {"$or": [{"asset_id": item.asset_id}, {"serial_number": item.serial_number}], "_id": {"$ne": ObjectId(id)}}
        )
        if existing_tag:
            logger.warning(f"Duplicate found: asset_id={existing_tag.get('asset_id')}, serial_number={existing_tag.get('serial_number')}")
            raise ValueError(f"Asset ID '{item.asset_id}' or serial number '{item.serial_number}' already exists")
        
        if existing["status"] == AssetStatus.RETIRED:
            logger.warning(f"Cannot update RETIRED asset: {id}")
            raise ValueError("Cannot update a retired asset")
        
        item_dict = item.dict(exclude_unset=True)
        item_dict["is_operational"] = item.status in [AssetStatus.AVAILABLE, AssetStatus.ASSIGNED]
        item_dict["updated_at"] = datetime.utcnow()
        
        result = db.update_one(
            {"_id": ObjectId(id)},
            {"$set": item_dict}
        )
        if result.matched_count == 0:
            logger.warning(f"Asset item not found: {id}")
            return None
        
        updated = db.find_one({"_id": ObjectId(id)})
        updated_dict = {
            **updated,
            "id": str(updated["_id"]),
            "_id": str(updated["_id"]),
            "category_name": category.get("category_name", "")
        }
        updated_item = AssetItem(**updated_dict)
        logger.debug(f"Updated asset item: {updated_item.name}")
        return updated_item
    except DuplicateKeyError:
        logger.warning(f"Duplicate found: asset_id={item.asset_id}, serial_number={item.serial_number}")
        raise ValueError(f"Asset ID '{item.asset_id}' or serial number '{item.serial_number}' already exists")
    except Exception as e:
        logger.error(f"Error updating asset item {id}: {str(e)}", exc_info=True)
        raise

def delete_asset_item(db: Collection, id: str) -> bool:
    """
    Delete an asset item if not assigned.
    """
    logger.info(f"Deleting asset item ID: {id}")
    try:
        if not ObjectId.is_valid(id):
            logger.warning(f"Invalid ObjectId: {id}")
            raise ValueError("Invalid asset ID")
        
        item = db.find_one({"_id": ObjectId(id)})
        if not item:
            logger.warning(f"Asset item not found: {id}")
            return False
        
        if item["has_active_assignment"]:
            logger.warning(f"Cannot delete assigned asset: {id}")
            raise ValueError("Cannot delete an assigned asset")
        
        result = db.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            logger.warning(f"Asset item not found: {id}")
            return False
        
        logger.debug(f"Deleted asset item ID: {id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting asset item {id}: {str(e)}", exc_info=True)
        raise

def get_asset_statistics(db: Collection) -> dict:
    """
    Calculate asset-related statistics for dashboard.
    """
    logger.info("Calculating asset statistics")
    try:
        total_assets = db.count_documents({})
        total_assigned = db.count_documents({"has_active_assignment": True})
        total_unassigned = total_assets - total_assigned
        total_under_maintenance = db.count_documents({"status": AssetStatus.UNDER_MAINTENANCE})
        total_operational = db.count_documents({"is_operational": True})
        utilization_rate = (total_operational / total_assets * 100) if total_assets > 0 else 0.0
        
        categories = db.database["asset_categories"].find()
        category_stats = [
            {
                "category_id": str(cat["_id"]),
                "category_name": cat.get("category_name", ""),
                "total_assets": db.count_documents({"category_id": str(cat["_id"])}),
                "assigned_assets": db.count_documents({"category_id": str(cat["_id"]), "has_active_assignment": True}),
                "unassigned": db.count_documents({"category_id": str(cat["_id"]), "has_active_assignment": False}),
                "under_maintenance": db.count_documents({"category_id": str(cat["_id"]), "status": AssetStatus.UNDER_MAINTENANCE}),
                "utilization_rate": (
                    db.count_documents({"category_id": str(cat["_id"]), "is_operational": True}) /
                    db.count_documents({"category_id": str(cat["_id"])}) * 100
                ) if db.count_documents({"category_id": str(cat["_id"])}) > 0 else 0.0
            }
            for cat in categories
        ]
        
        stats = {
            "total_assets": total_assets,
            "total_assigned": total_assigned,
            "total_unassigned": total_unassigned,
            "total_under_maintenance": total_under_maintenance,
            "total_operational": total_operational,
            "utilization_rate": round(utilization_rate, 2),
            "category_stats": category_stats
        }
        logger.debug(f"Asset statistics calculated: {stats}")
        return stats
    except Exception as e:
        logger.error(f"Error calculating asset statistics: {str(e)}", exc_info=True)
        raise