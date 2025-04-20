from pymongo.collection import Collection
from app.models.assignment_history import AssignmentHistoryCreate, AssignmentHistory
from app.models.asset_item import AssetStatus
from datetime import datetime
from bson import ObjectId
from typing import List
from fastapi import HTTPException

def get_assignment_history(db: Collection, asset_id: str) -> List[AssignmentHistory]:
    history = list(db.assignment_history.find({"asset_id": asset_id}))
    return [AssignmentHistory(**{**h, "id": str(h["_id"])}) for h in history]

def create_assignment_history(db: Collection, history: AssignmentHistoryCreate) -> AssignmentHistory:
    history_dict = history.dict()
    history_dict["created_at"] = datetime.utcnow()
    history_dict["updated_at"] = datetime.utcnow()
    # Validate references
    asset = db.asset_items.find_one({"_id": ObjectId(history.asset_id)})
    if not asset:
        raise HTTPException(status_code=400, detail="Invalid asset_id")
    employee = db.employees.find_one({"_id": ObjectId(history.assigned_to)})
    if not employee:
        raise HTTPException(status_code=400, detail="Invalid assigned_to")
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
            "current_assignee_id": history.assigned_to,
            "has_active_assignment": 1,
            "department": history_dict["department"],
            "status": AssetStatus.IN_USE,
            "current_assignment_date": history_dict["assignment_date"]
        })
        # Update Employee.assigned_assets
        db.employees.update_one(
            {"_id": ObjectId(history.assigned_to)},
            {"$addToSet": {"assigned_assets": history.asset_id}, "$set": {"updated_at": datetime.utcnow()}}
        )
    else:
        update_data.update({
            "current_assignee_id": None,
            "has_active_assignment": 0,
            "status": AssetStatus.AVAILABLE,
            "current_assignment_date": None
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

def delete_assignment_history_record(db: Collection, id: str) -> bool:
    try:
        result = db.assignment_history.delete_one({"_id": ObjectId(id)})
        return result.deleted_count > 0
    except:
        return False