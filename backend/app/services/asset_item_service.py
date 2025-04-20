from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError
from app.models.asset_item import AssetItemCreate, AssetItem, AssetItemBase, AssetStatus
from datetime import datetime
from bson import ObjectId
from typing import List, Optional
from fastapi import HTTPException

def get_asset_items(db: Collection, category_id: Optional[str] = None, status: Optional[str] = None, has_active_assignment: Optional[int] = None) -> List[AssetItem]:
    query = {}
    if category_id:
        query["category_id"] = category_id
    if status:
        query["status"] = status
    if has_active_assignment is not None:
        query["has_active_assignment"] = has_active_assignment
    print(f"MongoDB query: {query}")
    items = list(db.asset_items.find(query))
    print(f"Found {len(items)} items")
    return [AssetItem(**{**item, "id": str(item["_id"])}) for item in items]

def get_asset_item_by_id(db: Collection, id: str) -> Optional[AssetItem]:
    try:
        item = db.asset_items.find_one({"_id": ObjectId(id)})
        if item:
            return AssetItem(**{**item, "id": str(item["_id"])})
        return None
    except:
        return None

def create_asset_item(db: Collection, item: AssetItemCreate) -> AssetItem:
    item_dict = item.dict()
    item_dict["created_at"] = datetime.utcnow()
    item_dict["updated_at"] = datetime.utcnow()
    # Validate references
    if not db.asset_categories.find_one({"_id": ObjectId(item.category_id)}):
        raise ValueError("Invalid category_id")
    if item.current_assignee_id:
        employee = db.employees.find_one({"_id": ObjectId(item.current_assignee_id)})
        if not employee:
            raise ValueError("Invalid current_assignee_id")
    # Set has_active_assignment and status
    item_dict["has_active_assignment"] = 1 if item_dict.get("current_assignee_id") else 0
    if item_dict["has_active_assignment"]:
        item_dict["status"] = AssetStatus.IN_USE
    item_dict["is_operational"] = 0 if item_dict.get("status") in [AssetStatus.RETIRED, AssetStatus.LOST] else 1
    try:
        result = db.asset_items.insert_one(item_dict)
        if item_dict.get("current_assignee_id"):
            db.employees.update_one(
                {"_id": ObjectId(item.current_assignee_id)},
                {"$addToSet": {"assigned_assets": str(result.inserted_id)}, "$set": {"updated_at": datetime.utcnow()}}
            )
        value = item_dict.get("current_value", item_dict["purchase_cost"])
        db.asset_categories.update_one(
            {"_id": ObjectId(item.category_id)},
            {
                "$inc": {"count": 1, "total_value": value},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        return AssetItem(**{**item_dict, "id": str(result.inserted_id)})
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Asset tag already exists")

def update_asset_item(db: Collection, id: str, item: AssetItemBase) -> Optional[AssetItem]:
    try:
        existing_item = db.asset_items.find_one({"_id": ObjectId(id)})
        if not existing_item:
            return None
        update_data = item.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        if "category_id" in update_data:
            if not db.asset_categories.find_one({"_id": ObjectId(update_data["category_id"])}):
                raise ValueError("Invalid category_id")
        if "current_assignee_id" in update_data and update_data["current_assignee_id"]:
            employee = db.employees.find_one({"_id": ObjectId(update_data["current_assignee_id"])})
            if not employee:
                raise ValueError("Invalid current_assignee_id")
        if "current_assignee_id" in update_data:
            old_assignee_id = existing_item.get("current_assignee_id")
            new_assignee_id = update_data.get("current_assignee_id")
            if old_assignee_id and old_assignee_id != new_assignee_id:
                db.employees.update_one(
                    {"_id": ObjectId(old_assignee_id)},
                    {"$pull": {"assigned_assets": id}, "$set": {"updated_at": datetime.utcnow()}}
                )
            if new_assignee_id:
                db.employees.update_one(
                    {"_id": ObjectId(new_assignee_id)},
                    {"$addToSet": {"assigned_assets": id}, "$set": {"updated_at": datetime.utcnow()}}
                )
        update_data["has_active_assignment"] = 1 if update_data.get("current_assignee_id") else 0
        if "status" in update_data:
            update_data["is_operational"] = 0 if update_data["status"] in [AssetStatus.RETIRED, AssetStatus.LOST] else 1
            if update_data["has_active_assignment"] and update_data["status"] != AssetStatus.IN_USE:
                update_data["status"] = AssetStatus.IN_USE
        old_value = existing_item.get("current_value", existing_item["purchase_cost"])
        new_value = update_data.get("current_value", update_data.get("purchase_cost", old_value))
        if "category_id" in update_data and update_data["category_id"] != existing_item["category_id"]:
            db.asset_categories.update_one(
                {"_id": ObjectId(existing_item["category_id"])},
                {
                    "$inc": {"count": -1, "total_value": -old_value},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            db.asset_categories.update_one(
                {"_id": ObjectId(update_data["category_id"])},
                {
                    "$inc": {"count": 1, "total_value": new_value},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
        elif "current_value" in update_data or "purchase_cost" in update_data:
            db.asset_categories.update_one(
                {"_id": ObjectId(existing_item["category_id"])},
                {
                    "$inc": {"total_value": new_value - old_value},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
        try:
            result = db.asset_items.update_one(
                {"_id": ObjectId(id)},
                {"$set": update_data}
            )
            if result.modified_count == 0:
                return None
            updated_item = db.asset_items.find_one({"_id": ObjectId(id)})
            return AssetItem(**{**updated_item, "id": str(updated_item["_id"])})
        except DuplicateKeyError:
            raise HTTPException(status_code=400, detail="Asset tag already exists")
    except:
        return None

def delete_asset_item(db: Collection, id: str) -> bool:
    try:
        item = db.asset_items.find_one({"_id": ObjectId(id)})
        if not item:
            return False
        if item.get("has_active_assignment"):
            raise ValueError("Cannot delete assigned asset")
        value = item.get("current_value", item["purchase_cost"])
        db.asset_categories.update_one(
            {"_id": ObjectId(item["category_id"])},
            {
                "$inc": {"count": -1, "total_value": -value},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        if item.get("current_assignee_id"):
            db.employees.update_one(
                {"_id": ObjectId(item["current_assignee_id"])},
                {"$pull": {"assigned_assets": id}, "$set": {"updated_at": datetime.utcnow()}}
            )
        result = db.asset_items.delete_one({"_id": ObjectId(id)})
        return result.deleted_count > 0
    except:
        return False