
from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from app.models.asset_item import AssetItem, AssetItemCreate, AssetStatus
from app.models.employee import Employee, AssignedAsset
import logging

logger = logging.getLogger(__name__)

def get_asset_items(
    db: Collection,
    category_id: Optional[str] = None,
    status: Optional[AssetStatus] = None,
    has_active_assignment: Optional[bool] = None
) -> List[AssetItem]:
    """
    Retrieve asset items with optional filters.
    """
    logger.info(f"Fetching asset items - category_id: {category_id}, status: {status}, has_active_assignment: {has_active_assignment}")
    try:
        query = {}
        if category_id:
            query["category_id"] = str(category_id)  # Ensure stringified ObjectId
        if status:
            query["status"] = status
        if has_active_assignment is not None:
            query["has_active_assignment"] = has_active_assignment
        
        items = list(db.asset_items.find(query))
        result = []
        for item in items:
            category = db.asset_categories.find_one({"_id": ObjectId(item["category_id"])})
            item_dict = {**item, "id": str(item["_id"])}
            item_dict.pop("_id", None)
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
        
        item = db.asset_items.find_one({"_id": ObjectId(id)})
        if not item:
            logger.warning(f"Asset item not found: {id}")
            return None
        
        item_dict = {**item, "id": str(item["_id"])}
        item_dict.pop("_id", None)
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
        
        category = db.asset_categories.find_one({"_id": ObjectId(item.category_id)})
        if not category:
            logger.warning(f"Category not found: {item.category_id}")
            raise ValueError("Category not found")
        
        existing = db.asset_items.find_one({"$or": [{"asset_tag": item.asset_tag}, {"serial_number": item.serial_number}]})
        if existing:
            logger.warning(f"Duplicate found: asset_tag={existing.get('asset_tag')}, serial_number={existing.get('serial_number')}")
            raise ValueError(f"Asset tag '{item.asset_tag}' or serial number '{item.serial_number}' already exists")
        
        if item.status == AssetStatus.CONSUMED:
            logger.warning("Cannot create asset with CONSUMED status")
            raise ValueError("Cannot create asset with CONSUMED status")
        
        item_dict = item.dict(exclude_none=True)
        item_dict["has_active_assignment"] = False
        item_dict["is_operational"] = item.status in [AssetStatus.AVAILABLE, AssetStatus.IN_USE]
        item_dict["current_value"] = item.purchase_cost
        item_dict["created_at"] = datetime.utcnow()
        item_dict["assignment_history"] = []
        item_dict["maintenance_history"] = []
        item_dict["documents"] = []
        
        result = db.asset_items.insert_one(item_dict)
        logger.debug(f"Inserted asset item: {item.name} with ID: {result.inserted_id}")
        
        response_dict = {**item_dict, "id": str(result.inserted_id)}
        response_dict.pop("_id", None)
        created_item = AssetItem(**response_dict)
        logger.info(f"Created asset item with ID: {created_item.id}")
        return created_item
    except DuplicateKeyError:
        logger.warning(f"Duplicate found: asset_tag={item.asset_tag}, serial_number={item.serial_number}")
        raise ValueError(f"Asset tag '{item.asset_tag}' or serial_number '{item.serial_number}' already exists")
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
        
        existing = db.asset_items.find_one({"_id": ObjectId(id)})
        if not existing:
            logger.warning(f"Asset item not found: {id}")
            return None
        
        category = db.asset_categories.find_one({"_id": ObjectId(item.category_id)})
        if not category:
            logger.warning(f"Category not found: {item.category_id}")
            raise ValueError("Category not found")
        
        existing_tag = db.asset_items.find_one(
            {"$or": [{"asset_tag": item.asset_tag}, {"serial_number": item.serial_number}], "_id": {"$ne": ObjectId(id)}}
        )
        if existing_tag:
            logger.warning(f"Duplicate found: asset_tag={existing_tag.get('asset_tag')}, serial_number={existing_tag.get('serial_number')}")
            raise ValueError(f"Asset tag '{item.asset_tag}' or serial_number '{item.serial_number}' already exists")
        
        if existing["status"] == AssetStatus.CONSUMED:
            logger.warning(f"Cannot update CONSUMED asset: {id}")
            raise ValueError("Cannot update a consumed asset")
        
        item_dict = item.dict(exclude_unset=True)
        item_dict["is_operational"] = item.status in [AssetStatus.AVAILABLE, AssetStatus.IN_USE]
        item_dict["updated_at"] = datetime.utcnow()
        
        result = db.asset_items.update_one(
            {"_id": ObjectId(id)},
            {"$set": item_dict}
        )
        if result.matched_count == 0:
            logger.warning(f"Asset item not found: {id}")
            return None
        
        updated = db.asset_items.find_one({"_id": ObjectId(id)})
        updated_item = AssetItem(**{**updated, "id": str(updated["_id"])})
        logger.debug(f"Updated asset item: {updated_item.name}")
        return updated_item
    except DuplicateKeyError:
        logger.warning(f"Duplicate found: asset_tag={item.asset_tag}, serial_number={item.serial_number}")
        raise ValueError(f"Asset tag '{item.asset_tag}' or serial_number '{item.serial_number}' already exists")
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
        
        item = db.asset_items.find_one({"_id": ObjectId(id)})
        if not item:
            logger.warning(f"Asset item not found: {id}")
            return False
        
        if item["has_active_assignment"]:
            logger.warning(f"Cannot delete assigned asset: {id}")
            raise ValueError("Cannot delete an assigned asset")
        
        result = db.asset_items.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            logger.warning(f"Asset item not found: {id}")
            return False
        
        logger.debug(f"Deleted asset item ID: {id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting asset item {id}: {str(e)}", exc_info=True)
        raise

def assign_asset_item(db: Collection, asset_id: str, employee_id: str, department: Optional[str] = None) -> Optional[AssetItem]:
    """
    Assign an asset item to an employee.
    """
    logger.info(f"Assigning asset item {asset_id} to employee {employee_id}")
    try:
        if not ObjectId.is_valid(asset_id) or not ObjectId.is_valid(employee_id):
            logger.warning(f"Invalid IDs - asset_id: {asset_id}, employee_id: {employee_id}")
            raise ValueError("Invalid asset or employee ID")
        
        asset = db.asset_items.find_one({"_id": ObjectId(asset_id)})
        if not asset:
            logger.warning(f"Asset item not found: {asset_id}")
            raise ValueError("Asset item not found")
        
        employee = db.employee.find_one({"_id": ObjectId(employee_id)})
        if not employee:
            logger.warning(f"Employee not found: {employee_id}")
            raise ValueError("Employee not found")
        
        category = db.asset_categories.find_one({"_id": ObjectId(asset["category_id"])})
        if not category:
            logger.warning(f"Category not found: {asset['category_id']}")
            raise ValueError("Category not found")
        
        if asset["has_active_assignment"] and category["allow_multiple_assignments"] != 1:
            logger.warning(f"Asset already assigned and multiple assignments not allowed: {asset_id}")
            raise ValueError("Asset is already assigned and multiple assignments are not allowed")
        
        assignment_entry = {
            "_id": ObjectId(),
            "asset_id": asset_id,
            "assigned_to": [employee_id],
            "department": department or employee.get("department", None),
            "condition_at_assignment": asset["condition"],
            "condition_at_return": None,
            "assignment_date": datetime.utcnow(),
            "return_date": None,
            "notes": f"Assigned to {employee['name']}",
            "created_at": datetime.utcnow(),
            "updated_at": None
        }
        
        employee_assignment = AssignedAsset(
            asset_id=asset_id,
            assigned_at=datetime.utcnow()
        )
        
        result = db.asset_items.update_one(
            {"_id": ObjectId(asset_id)},
            {
                "$set": {
                    "has_active_assignment": True,
                    "current_assignee_id": employee_id,
                    "current_assignment_date": datetime.utcnow(),
                    "department": department or employee.get("department", None),
                    "updated_at": datetime.utcnow()
                },
                "$push": {"assignment_history": assignment_entry}
            }
        )
        if result.matched_count == 0:
            logger.warning(f"Asset item not found: {asset_id}")
            raise ValueError("Asset item not found")
        
        db.employee.update_one(
            {"_id": ObjectId(employee_id)},
            {
                "$push": {"assigned_assets": employee_assignment.dict()},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        updated_asset = db.asset_items.find_one({"_id": ObjectId(asset_id)})
        updated_item = AssetItem(**{**updated_asset, "id": str(updated_asset["_id"])})
        logger.debug(f"Assigned asset item: {updated_item.name} to employee {employee_id}")
        return updated_item
    except Exception as e:
        logger.error(f"Error assigning asset item {asset_id}: {str(e)}", exc_info=True)
        raise

def unassign_asset_item(db: Collection, asset_id: str) -> Optional[AssetItem]:
    """
    Unassign an asset item from its current assignee.
    """
    logger.info(f"Unassigning asset item {asset_id}")
    try:
        if not ObjectId.is_valid(asset_id):
            logger.warning(f"Invalid asset ID: {asset_id}")
            raise ValueError("Invalid asset ID")
        
        asset = db.asset_items.find_one({"_id": ObjectId(asset_id)})
        if not asset:
            logger.warning(f"Asset item not found: {asset_id}")
            raise ValueError("Asset item not found")
        
        if not asset["has_active_assignment"]:
            logger.warning(f"Asset is not assigned: {asset_id}")
            raise ValueError("Asset is not currently assigned")
        
        current_assignee_id = asset.get("current_assignee_id")
        if not current_assignee_id:
            logger.warning(f"No assignee found for asset: {asset_id}")
            raise ValueError("No assignee found for asset")
        
        result = db.asset_items.update_one(
            {"_id": ObjectId(asset_id)},
            {
                "$set": {
                    "has_active_assignment": False,
                    "current_assignee_id": None,
                    "current_assignment_date": None,
                    "updated_at": datetime.utcnow()
                },
                "$push": {
                    "assignment_history": {
                        "_id": ObjectId(),
                        "asset_id": asset_id,
                        "assigned_to": [current_assignee_id],
                        "department": asset.get("department", None),
                        "condition_at_assignment": asset["condition"],
                        "condition_at_return": asset["condition"],
                        "assignment_date": asset["current_assignment_date"],
                        "return_date": datetime.utcnow(),
                        "notes": "Asset unassigned",
                        "created_at": datetime.utcnow(),
                        "updated_at": None
                    }
                }
            }
        )
        if result.matched_count == 0:
            logger.warning(f"Asset item not found: {asset_id}")
            raise ValueError("Asset item not found")
        
        db.employee.update_one(
            {"_id": ObjectId(current_assignee_id), "assigned_assets.asset_id": asset_id},
            {
                "$pull": {"assigned_assets": {"asset_id": asset_id}},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        updated_asset = db.asset_items.find_one({"_id": ObjectId(asset_id)})
        updated_item = AssetItem(**{**updated_asset, "id": str(updated_asset["_id"])})
        logger.debug(f"Unassigned asset item: {updated_item.name}")
        return updated_item
    except Exception as e:
        logger.error(f"Error unassigning asset item {asset_id}: {str(e)}", exc_info=True)
        raise

def get_asset_statistics(db: Collection) -> dict:
    """
    Calculate asset-related statistics for dashboard.
    """
    logger.info("Calculating asset statistics")
    try:
        total_assets = db.asset_items.count_documents({})
        total_assigned = db.asset_items.count_documents({"has_active_assignment": True})
        total_unassigned = total_assets - total_assigned
        total_under_maintenance = db.asset_items.count_documents({"status": AssetStatus.UNDER_MAINTENANCE})
        total_operational = db.asset_items.count_documents({"is_operational": True})
        utilization_rate = (total_operational / total_assets * 100) if total_assets > 0 else 0.0
        
        categories = db.asset_categories.find()
        category_stats = [
            {
                "category_id": str(cat["_id"]),
                "name": cat["name"],
                "count": db.asset_items.count_documents({"category_id": str(cat["_id"])}),
                "assigned": db.asset_items.count_documents({"category_id": str(cat["_id"]), "has_active_assignment": True}),
                "unassigned": db.asset_items.count_documents({"category_id": str(cat["_id"]), "has_active_assignment": False}),
                "maintenance_count": db.asset_items.count_documents({"category_id": str(cat["_id"]), "status": AssetStatus.UNDER_MAINTENANCE}),
                "utilization_rate": (
                    db.asset_items.count_documents({"category_id": str(cat["_id"]), "is_operational": True}) /
                    db.asset_items.count_documents({"category_id": str(cat["_id"])}) * 100
                ) if db.asset_items.count_documents({"category_id": str(cat["_id"])}) > 0 else 0.0
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
