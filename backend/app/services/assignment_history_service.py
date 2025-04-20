from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError
from app.models.assignment_history import AssignmentHistoryCreate, AssignmentHistory
from app.models.asset_item import AssetStatus
from datetime import datetime, timedelta
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
    category = db.asset_categories.find_one({"_id": ObjectId(asset["category_id"])})
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category_id")
    allow_multiple_assignments = category.get("allow_multiple_assignments", 0)
    # Validate employees
    for emp_id in history.assigned_to:
        employee = db.employees.find_one({"_id": ObjectId(emp_id)})
        if not employee:
            raise HTTPException(status_code=400, detail=f"Invalid assigned_to: {emp_id}")
        if not history_dict.get("department"):
            history_dict["department"] = employee["department"]
    # Check if asset is already assigned and multiple assignments are not allowed
    if not allow_multiple_assignments and asset.get("has_active_assignment", 0) == 1 and not history_dict.get("return_date"):
        raise HTTPException(status_code=400, detail="Asset is already assigned and multiple assignments are not allowed")
    # Check assignment duration
    assignment_duration = category.get("assignment_duration")
    duration_unit = category.get("duration_unit", "months")
    if assignment_duration:
        delta = None
        if duration_unit == "days":
            delta = timedelta(days=assignment_duration)
        elif duration_unit == "months":
            delta = timedelta(days=assignment_duration * 30)
        elif duration_unit == "years":
            delta = timedelta(days=assignment_duration * 365)
        if delta and asset.get("current_assignment_date"):
            expiry_date = asset["current_assignment_date"] + delta
            if datetime.utcnow() > expiry_date:
                # Unassign expired assignments
                db.employees.update_many(
                    {"assigned_assets": history.asset_id},
                    {"$pull": {"assigned_assets": history.asset_id}, "$set": {"updated_at": datetime.utcnow()}}
                )
                db.asset_items.update_one(
                    {"_id": ObjectId(history.asset_id)},
                    {"$set": {
                        "current_assignee_id": [],
                        "has_active_assignment": 0,
                        "status": AssetStatus.AVAILABLE,
                        "current_assignment_date": None,
                        "updated_at": datetime.utcnow()
                    }}
                )
                db.assignment_history.update_many(
                    {"asset_id": history.asset_id, "is_active": 1},
                    {"$set": {"is_active": 0, "return_date": datetime.utcnow(), "updated_at": datetime.utcnow()}}
                )
                asset["current_assignee_id"] = []
                asset["has_active_assignment"] = 0
    # Check other fields
    if asset.get("warranty_expiration") and asset["warranty_expiration"] < datetime.utcnow():
        db.asset_items.update_one(
            {"_id": ObjectId(history.asset_id)},
            {"$set": {"is_operational": 0, "status": AssetStatus.RETIRED, "updated_at": datetime.utcnow()}}
        )
        raise HTTPException(status_code=400, detail="Asset warranty expired")
    if category.get("expected_life") and asset.get("purchase_date"):
        life_delta = timedelta(days=category["expected_life"] * 365)
        if asset["purchase_date"] + life_delta < datetime.utcnow():
            db.asset_items.update_one(
                {"_id": ObjectId(history.asset_id)},
                {"$set": {"status": AssetStatus.RETIRED, "is_operational": 0, "updated_at": datetime.utcnow()}}
            )
            raise HTTPException(status_code=400, detail="Asset has exceeded expected life")
    if category.get("maintenance_alert_days") and asset.get("current_assignment_date"):
        maintenance_delta = timedelta(days=category["maintenance_alert_days"])
        if datetime.utcnow() > asset["current_assignment_date"] + maintenance_delta:
            db.asset_items.update_one(
                {"_id": ObjectId(history.asset_id)},
                {"$set": {"status": AssetStatus.UNDER_MAINTENANCE, "updated_at": datetime.utcnow()}}
            )
            raise HTTPException(status_code=400, detail="Asset requires maintenance")
    # Update AssetItem
    update_data = {
        "updated_at": datetime.utcnow()
    }
    if not history_dict.get("return_date"):
        current_assignees = asset.get("current_assignee_id", [])
        new_assignees = list(set(current_assignees + history.assigned_to))
        update_data.update({
            "current_assignee_id": new_assignees,
            "has_active_assignment": 1,
            "department": history_dict["department"],
            "status": AssetStatus.IN_USE,
            "current_assignment_date": history_dict["assignment_date"]
        })
        # Update Employee.assigned_assets
        for emp_id in history.assigned_to:
            db.employees.update_one(
                {"_id": ObjectId(emp_id)},
                {"$addToSet": {"assigned_assets": history.asset_id}, "$set": {"updated_at": datetime.utcnow()}}
            )
    else:
        current_assignees = asset.get("current_assignee_id", [])
        for emp_id in history.assigned_to:
            if emp_id in current_assignees:
                current_assignees.remove(emp_id)
            db.employees.update_one(
                {"_id": ObjectId(emp_id)},
                {"$pull": {"assigned_assets": history.asset_id}, "$set": {"updated_at": datetime.utcnow()}}
            )
        update_data.update({
            "current_assignee_id": current_assignees,
            "has_active_assignment": 1 if current_assignees else 0,
            "status": AssetStatus.AVAILABLE if not current_assignees else AssetStatus.IN_USE,
            "current_assignment_date": None if not current_assignees else update_data.get("current_assignment_date")
        })
    db.asset_items.update_one(
        {"_id": ObjectId(history.asset_id)},
        {"$set": update_data}
    )
    # Set is_active
    history_dict["is_active"] = 0 if history_dict.get("return_date") else 1
    result = db.assignment_history.insert_one(history_dict)
    return AssignmentHistory(**{**history_dict, "id": str(result.inserted_id)})

def unassign_employee_from_asset(db: Collection, asset_id: str, employee_id: str) -> AssignmentHistory:
    """
    Unassign a specific employee from an asset, updating AssetItem, Employee, and AssignmentHistory.
    """
    # Validate asset
    asset = db.asset_items.find_one({"_id": ObjectId(asset_id)})
    if not asset:
        raise HTTPException(status_code=400, detail="Invalid asset_id")
    
    # Validate employee
    employee = db.employees.find_one({"_id": ObjectId(employee_id)})
    if not employee:
        raise HTTPException(status_code=400, detail="Invalid employee_id")
    
    # Check if employee is assigned to the asset
    current_assignees = asset.get("current_assignee_id", [])
    if employee_id not in current_assignees:
        raise HTTPException(status_code=400, detail="Employee is not assigned to this asset")
    
    # Update AssignmentHistory (mark current assignment as inactive)
    db.assignment_history.update_many(
        {"asset_id": asset_id, "assigned_to": employee_id, "is_active": 1},
        {"$set": {
            "is_active": 0,
            "return_date": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Update AssetItem
    current_assignees.remove(employee_id)
    update_data = {
        "current_assignee_id": current_assignees,
        "has_active_assignment": 1 if current_assignees else 0,
        "status": AssetStatus.AVAILABLE if not current_assignees else AssetStatus.IN_USE,
        "current_assignment_date": None if not current_assignees else asset.get("current_assignment_date"),
        "updated_at": datetime.utcnow()
    }
    db.asset_items.update_one(
        {"_id": ObjectId(asset_id)},
        {"$set": update_data}
    )
    
    # Update Employee
    db.employees.update_one(
        {"_id": ObjectId(employee_id)},
        {"$pull": {"assigned_assets": asset_id}, "$set": {"updated_at": datetime.utcnow()}}
    )
    
    # Create new AssignmentHistory record for unassignment
    history_dict = {
        "asset_id": asset_id,
        "assigned_to": [employee_id],
        "department": asset.get("department"),
        "condition": asset.get("condition"),
        "assignment_date": asset.get("current_assignment_date"),
        "return_date": datetime.utcnow(),
        "is_active": 0,
        "notes": f"Unassigned employee {employee_id} from asset {asset_id}",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = db.assignment_history.insert_one(history_dict)
    return AssignmentHistory(**{**history_dict, "id": str(result.inserted_id)})

def delete_assignment_history_record(db: Collection, id: str) -> bool:
    try:
        result = db.assignment_history.delete_one({"_id": ObjectId(id)})
        return result.deleted_count > 0
    except:
        return False