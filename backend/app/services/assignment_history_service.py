from pymongo.collection import Collection
from app.models.assignment_history import AssignmentHistoryCreate, AssignmentHistory
from app.models.asset_item import AssetStatus
from datetime import datetime
from bson import ObjectId
from typing import List

def get_assignment_history(db: Collection, asset_id: str) -> List[AssignmentHistory]:
    history = list(db.assignment_history.find({"asset_id": asset_id}))
    return [AssignmentHistory(**{**h, "id": str(h["_id"])}) for h in history]

def create_assignment_history(db: Collection, history: AssignmentHistoryCreate) -> AssignmentHistory:
    history_dict = history.dict()
    history_dict["created_at"] = datetime.utcnow()
    # Validate references
    asset = db.asset_items.find_one({"_id": ObjectId(history.asset_id)})
    if not asset:
        raise ValueError("Invalid asset_id")
    employee = db.employees.find_one({"_id": ObjectId(history.assigned_to)})
    if not employee:
        raise ValueError("Invalid assigned_to")
    # Set department from employee if unset
    if not history_dict.get("department"):
        history_dict["department"] = employee["department"]
    # Set is_active
    history_dict["is_active"] = 0 if history_dict.get("return_date") else 1
    # Update AssetItem
    update_data = {
        "updated_at": datetime.utcnow()
    }
    if not history_dict.get("return_date"):
        update_data.update({
            "assigned_to": history.assigned_to,
            "is_assigned": 1,
            "department": history_dict["department"],
            "status": AssetStatus.IN_USE,
            "is_active": 1
        })
        # Update Employee.assigned_assets
        db.employees.update_one(
            {"_id": ObjectId(history.assigned_to)},
            {"$addToSet": {"assigned_assets": history.asset_id}, "$set": {"updated_at": datetime.utcnow()}}
        )
    else:
        update_data.update({
            "assigned_to": None,
            "is_assigned": 0,
            "status": AssetStatus.AVAILABLE
        })
        # Remove from Employee.assigned_assets
        db.employees.update_one(
            {"_id": ObjectId(history.assigned_to)},
            {"$pull": {"assigned_assets": history.asset_id}, "$set": {"updated_at": datetime.utcnow()}}
        )
    db.asset_items.update_one(
        {"_id": ObjectId(history.asset_id)},
        {"$set": update_data}
    )
    result = db.assignment_history.insert_one(history_dict)
    return AssignmentHistory(**{**history_dict, "id": str(result.inserted_id)})