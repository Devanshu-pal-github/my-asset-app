from pymongo.collection import Collection
from app.models.maintenance_history import MaintenanceHistoryCreate, MaintenanceHistory
from app.models.asset_item import AssetStatus
from datetime import datetime
from bson import ObjectId
from typing import List

def get_maintenance_history(db: Collection, asset_id: str) -> List[MaintenanceHistory]:
    history = list(db.maintenance_history.find({"asset_id": asset_id}))
    return [MaintenanceHistory(**{**h, "id": str(h["_id"])}) for h in history]

def create_maintenance_history(db: Collection, history: MaintenanceHistoryCreate) -> MaintenanceHistory:
    history_dict = history.dict()
    history_dict["created_at"] = datetime.utcnow()
    # Validate asset_id
    asset = db.asset_items.find_one({"_id": ObjectId(history.asset_id)})
    if not asset:
        raise ValueError("Invalid asset_id")
    # Set is_completed
    history_dict["is_completed"] = 1 if history_dict.get("completed_date") else 0
    # Update AssetItem
    update_data = {
        "updated_at": datetime.utcnow()
    }
    if not history_dict.get("completed_date"):
        update_data["status"] = AssetStatus.UNDER_MAINTENANCE
        update_data["is_active"] = 0
    else:
        update_data["status"] = AssetStatus.AVAILABLE
        update_data["is_active"] = 1
        if history_dict.get("condition_after"):
            update_data["condition"] = history_dict["condition_after"]
    db.asset_items.update_one(
        {"_id": ObjectId(history.asset_id)},
        {"$set": update_data}
    )
    result = db.maintenance_history.insert_one(history_dict)
    return MaintenanceHistory(**{**history_dict, "id": str(result.inserted_id)})