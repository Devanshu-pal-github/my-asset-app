from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.asset_item import AssetItem, AssetItemCreate, AssetItemUpdate, AssetStatus, AssetCondition, AssetHistoryEntry
import logging

logger = logging.getLogger(__name__)

def get_asset_items(db: Collection, query: Dict[str, Any] = None) -> List[AssetItem]:
    """
    Retrieve asset items with optional filters.
    """
    if query is None:
        query = {}
        
    logger.info(f"Fetching asset items with query: {query}")
    try:
        items = list(db.find(query))
        result = []
        for item in items:
            # Get category info
            category_id = item.get("category_id")
            category = db.database["asset_categories"].find_one({"_id": ObjectId(category_id)}) if category_id else None
            
            # Get assignee info if assigned
            assignee_id = item.get("current_assignee_id")
            assignee = db.database["employees"].find_one({"_id": ObjectId(assignee_id)}) if assignee_id else None
            assignee_name = f"{assignee.get('first_name', '')} {assignee.get('last_name', '')}" if assignee else None
            
            # Prepare the response with all fields
            item_dict = {
                **item,
                "id": str(item["_id"]),
                "_id": str(item["_id"]),
                "category_name": category.get("category_name", "") if category else "",
                "current_assignee_name": assignee_name,
            }
            
            # Convert ObjectIds in nested arrays to strings
            if "assignment_history" in item_dict:
                for history in item_dict["assignment_history"]:
                    if "_id" in history:
                        history["_id"] = str(history["_id"])
            
            if "maintenance_history" in item_dict:
                for history in item_dict["maintenance_history"]:
                    if "_id" in history:
                        history["_id"] = str(history["_id"])
                        
            if "documents" in item_dict:
                for doc in item_dict["documents"]:
                    if "_id" in doc:
                        doc["_id"] = str(doc["_id"])
            
            try:
                result.append(AssetItem(**item_dict))
            except Exception as e:
                logger.error(f"Error creating AssetItem model: {str(e)}", exc_info=True)
                # Continue with next item instead of failing
        
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
        
        # Get category info
        category_id = item.get("category_id")
        category = db.database["asset_categories"].find_one({"_id": ObjectId(category_id)}) if category_id else None
        
        # Get assignee info if assigned
        assignee_id = item.get("current_assignee_id")
        assignee = db.database["employees"].find_one({"_id": ObjectId(assignee_id)}) if assignee_id else None
        assignee_name = f"{assignee.get('first_name', '')} {assignee.get('last_name', '')}" if assignee else None
        
        # Prepare the response with all fields
        item_dict = {
            **item,
            "id": str(item["_id"]),
            "_id": str(item["_id"]),
            "category_name": category.get("category_name", "") if category else "",
            "current_assignee_name": assignee_name,
        }
        
        # Convert ObjectIds in nested arrays to strings
        if "assignment_history" in item_dict:
            for history in item_dict["assignment_history"]:
                if "_id" in history:
                    history["_id"] = str(history["_id"])
        
        if "maintenance_history" in item_dict:
            for history in item_dict["maintenance_history"]:
                if "_id" in history:
                    history["_id"] = str(history["_id"])
                    
        if "documents" in item_dict:
            for doc in item_dict["documents"]:
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
        
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
        
        # Check for duplicate asset tag or serial number
        existing = db.find_one({"$or": [
            {"asset_tag": item.asset_tag},
            {"serial_number": item.serial_number}
        ]})
        
        if existing:
            logger.warning(f"Duplicate found: asset_tag={existing.get('asset_tag')}, serial_number={existing.get('serial_number')}")
            raise ValueError(f"Asset tag '{item.asset_tag}' or serial number '{item.serial_number}' already exists")
        
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
        item_dict["history"] = []
        
        # Add a history entry for the creation
        history_entry = {
            "id": str(ObjectId()),
            "type": "creation",
            "date": datetime.utcnow(),
            "details": {
                "action": "Created asset",
                "status": item.status
            },
            "notes": "Initial creation"
        }
        item_dict["history"].append(history_entry)
        
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
        logger.warning(f"Duplicate found: asset_tag={item.asset_tag}, serial_number={item.serial_number}")
        raise ValueError(f"Asset tag '{item.asset_tag}' or serial number '{item.serial_number}' already exists")
    except Exception as e:
        logger.error(f"Error creating asset item: {str(e)}", exc_info=True)
        raise

def update_asset_item(db: Collection, id: str, item: AssetItemUpdate) -> Optional[AssetItem]:
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
        
        # Validate category if provided
        if item.category_id:
            if not ObjectId.is_valid(item.category_id):
                logger.warning(f"Invalid category ID: {item.category_id}")
                raise ValueError("Invalid category ID")
            
            category = db.database["asset_categories"].find_one({"_id": ObjectId(item.category_id)})
            if not category:
                logger.warning(f"Category not found: {item.category_id}")
                raise ValueError("Category not found")
        else:
            category_id = existing.get("category_id")
            category = db.database["asset_categories"].find_one({"_id": ObjectId(category_id)}) if category_id else None
        
        # Check for duplicate asset tag or serial number
        if item.asset_tag or item.serial_number:
            duplicate_query = {"_id": {"$ne": ObjectId(id)}, "$or": []}
            
            if item.asset_tag:
                duplicate_query["$or"].append({"asset_tag": item.asset_tag})
            
            if item.serial_number:
                duplicate_query["$or"].append({"serial_number": item.serial_number})
            
            if duplicate_query["$or"]:
                existing_tag = db.find_one(duplicate_query)
                if existing_tag:
                    logger.warning(f"Duplicate found: asset_tag={existing_tag.get('asset_tag')}, serial_number={existing_tag.get('serial_number')}")
                    raise ValueError(f"Asset tag or serial number already exists")
        
        # Prevent update of retired assets unless changing status
        if existing["status"] == AssetStatus.RETIRED and (not item.status or item.status == AssetStatus.RETIRED):
            logger.warning(f"Cannot update RETIRED asset: {id}")
            raise ValueError("Cannot update a retired asset")
        
        item_dict = item.dict(exclude_unset=True, exclude_none=True)
        
        # Update operational status based on new status
        if "status" in item_dict:
            item_dict["is_operational"] = item_dict["status"] in [AssetStatus.AVAILABLE.value, AssetStatus.ASSIGNED.value]
        
        # Add an update entry to the history
        history_entry = {
            "id": str(ObjectId()),
            "type": "update",
            "date": datetime.utcnow(),
            "details": {
                "action": "Updated asset",
                "fields_updated": list(item_dict.keys())
            },
            "notes": "Updated via API"
        }
        
        # Add history entry
        db.update_one(
            {"_id": ObjectId(id)},
            {"$push": {"history": history_entry}}
        )
        
        # Set the updated timestamp
        item_dict["updated_at"] = datetime.utcnow()
        
        # Apply all updates
        result = db.update_one(
            {"_id": ObjectId(id)},
            {"$set": item_dict}
        )
        
        if result.matched_count == 0:
            logger.warning(f"Asset item not found: {id}")
            return None
        
        # Get the updated asset
        updated = db.find_one({"_id": ObjectId(id)})
        
        # Get assignee info if assigned
        assignee_id = updated.get("current_assignee_id")
        assignee = db.database["employees"].find_one({"_id": ObjectId(assignee_id)}) if assignee_id else None
        assignee_name = f"{assignee.get('first_name', '')} {assignee.get('last_name', '')}" if assignee else None
        
        # Prepare the response with all fields
        updated_dict = {
            **updated,
            "id": str(updated["_id"]),
            "_id": str(updated["_id"]),
            "category_name": category.get("category_name", "") if category else "",
            "current_assignee_name": assignee_name,
        }
        
        # Convert ObjectIds in nested arrays to strings
        if "assignment_history" in updated_dict:
            for history in updated_dict["assignment_history"]:
                if "_id" in history:
                    history["_id"] = str(history["_id"])
        
        if "maintenance_history" in updated_dict:
            for history in updated_dict["maintenance_history"]:
                if "_id" in history:
                    history["_id"] = str(history["_id"])
                    
        if "documents" in updated_dict:
            for doc in updated_dict["documents"]:
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
        
        updated_item = AssetItem(**updated_dict)
        logger.debug(f"Updated asset item: {updated_item.name}")
        return updated_item
    except DuplicateKeyError:
        logger.warning(f"Duplicate found: asset_tag={item.asset_tag}, serial_number={item.serial_number}")
        raise ValueError(f"Asset tag or serial number already exists")
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
        
        existing = db.find_one({"_id": ObjectId(id)})
        if not existing:
            logger.warning(f"Asset item not found: {id}")
            return False
        
        if existing.get("has_active_assignment"):
            logger.warning(f"Cannot delete assigned asset: {id}")
            raise ValueError("Cannot delete an assigned asset")
        
        result = db.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            logger.warning(f"Asset item not found for deletion: {id}")
            return False
        
        logger.debug(f"Deleted asset item ID: {id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting asset item {id}: {str(e)}", exc_info=True)
        raise

def get_asset_statistics(db: Collection) -> dict:
    """
    Get statistics for assets (total count, assigned, under maintenance, etc.).
    """
    logger.info("Calculating asset statistics")
    try:
        total = db.count_documents({})
        assigned = db.count_documents({"has_active_assignment": True})
        available = db.count_documents({"status": AssetStatus.AVAILABLE})
        under_maintenance = db.count_documents({"status": AssetStatus.UNDER_MAINTENANCE})
        retired = db.count_documents({"status": AssetStatus.RETIRED})
        lost = db.count_documents({"status": AssetStatus.LOST})
        
        # Get values per category
        pipeline = [
            {"$group": {
                "_id": "$category_id",
                "count": {"$sum": 1},
                "value": {"$sum": "$purchase_cost"}
            }}
        ]
        category_stats = list(db.aggregate(pipeline))
        
        # Add category names to the results
        for stat in category_stats:
            if stat["_id"] and ObjectId.is_valid(stat["_id"]):
                cat = db.database["asset_categories"].find_one({"_id": ObjectId(stat["_id"])})
                if cat:
                    stat["category_name"] = cat.get("category_name", "Unknown")
                else:
                    stat["category_name"] = "Unknown"
            else:
                stat["category_name"] = "Unknown"
            stat["id"] = stat.pop("_id")
        
        # Get total asset value
        total_value = sum(item.get("purchase_cost", 0) for item in db.find())
        current_value = sum(item.get("current_value", 0) for item in db.find())
        depreciation = total_value - current_value
        
        # Calculate utilization rate 
        utilization_rate = (assigned / total * 100) if total > 0 else 0
        
        statistics = {
            "total": total,
            "assigned": assigned,
            "available": available,
            "under_maintenance": under_maintenance,
            "retired": retired,
            "lost": lost,
            "utilization_rate": round(utilization_rate, 2),
            "total_value": round(total_value, 2),
            "current_value": round(current_value, 2),
            "depreciation": round(depreciation, 2),
            "by_category": category_stats
        }
        
        logger.debug(f"Asset statistics calculated: {statistics}")
        return statistics
    except Exception as e:
        logger.error(f"Error calculating asset statistics: {str(e)}", exc_info=True)
        raise